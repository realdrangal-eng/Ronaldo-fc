#!/usr/bin/env bash
#
# Builds the Rockstar Shop storefront into an installable Android APK.
#
# There is no Android Studio and no Android SDK involved. The toolchain is
# assembled from public Maven Central / GitHub artifacts on first run and
# cached in android/.tools:
#
#   aapt        - resource compiler + APK packager (bundled inside apktool-lib)
#   android.jar - API 34 platform stubs to compile and link against
#   dx          - Java bytecode -> Dalvik DEX (com.jakewharton.android.repackaged)
#   apksig      - Google's v1 + v2 APK signing library
#
# Usage:  ./android/build.sh [--release keystore.p12 storepass alias keypass]
# Output: android/build/ronaldo-fc.apk

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AND="$ROOT/android"
TOOLS="$AND/.tools"
BUILD="$AND/build"

PKG="com.rockstarshop.store"
MIN_SDK=24
APK_NAME="rockstar-shop.apk"
SRC_WWW="$ROOT/rockstar-shop"

APKTOOL_LIB_URL="https://repo1.maven.org/maven2/org/apktool/apktool-lib/2.12.1/apktool-lib-2.12.1.jar"
APKSIG_URL="https://repo1.maven.org/maven2/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar"
DX_URL="https://repo1.maven.org/maven2/com/jakewharton/android/repackaged/dalvik-dx/16.0.1/dalvik-dx-16.0.1.jar"
ANDROID_JAR_URL="https://raw.githubusercontent.com/Sable/android-platforms/master/android-34/android.jar"

say() { printf '\n\033[1;33m==>\033[0m %s\n' "$*"; }

# The JVM echoes JAVA_TOOL_OPTIONS on every start in this environment; drop that line.
quiet() { "$@" 2> >(grep -v 'Picked up JAVA_TOOL_OPTIONS' >&2); }

# apksig 2.3.0 predates the module system and builds PKCS#7 blocks straight out
# of the JDK's internal sun.security classes, so they have to be exported.
JAVA_LEGACY_EXPORTS=(
  --add-exports java.base/sun.security.x509=ALL-UNNAMED
  --add-exports java.base/sun.security.pkcs=ALL-UNNAMED
  --add-exports java.base/sun.security.util=ALL-UNNAMED
)

# ---------------------------------------------------------------- toolchain --
fetch() {  # fetch <url> <dest>
  [ -s "$2" ] && return 0
  echo "    downloading $(basename "$2")"
  curl -fsSL --retry 3 --retry-delay 2 --max-time 600 -o "$2.part" "$1"
  mv "$2.part" "$2"
}

say "Preparing toolchain"
mkdir -p "$TOOLS"

if [ ! -x "$TOOLS/aapt" ]; then
  fetch "$APKTOOL_LIB_URL" "$TOOLS/apktool-lib.jar"
  ( cd "$TOOLS" && unzip -o -q apktool-lib.jar "prebuilt/linux/aapt_64" \
      && mv prebuilt/linux/aapt_64 aapt && chmod +x aapt && rm -rf prebuilt apktool-lib.jar )
fi
fetch "$APKSIG_URL"      "$TOOLS/apksig.jar"
fetch "$DX_URL"          "$TOOLS/dx.jar"
fetch "$ANDROID_JAR_URL" "$TOOLS/android.jar"
echo "    aapt: $("$TOOLS/aapt" version)"

# ------------------------------------------------------------------- staging --
say "Staging storefront"
rm -rf "$BUILD"
mkdir -p "$BUILD/assets/www" "$BUILD/classes"

cp "$SRC_WWW/index.html" "$SRC_WWW/styles.css" "$SRC_WWW/app.js" "$BUILD/assets/www/"
cp -r "$SRC_WWW/assets" "$BUILD/assets/www/assets"

# The store uses a system font stack and no remote resources, so nothing needs
# vendoring - but fail loudly if that ever stops being true, since the APK
# ships without the INTERNET permission.
if grep -qE 'https?://' "$BUILD/assets/www/index.html" "$BUILD/assets/www/styles.css"; then
  echo "ERROR: the storefront references a remote URL; the APK has no network access" >&2
  grep -nE 'https?://' "$BUILD/assets/www/index.html" "$BUILD/assets/www/styles.css" >&2
  exit 1
fi
echo "    staged $(find "$BUILD/assets/www" -type f | wc -l) files, $(du -sh "$BUILD/assets/www" | cut -f1)"

say "Generating launcher icons"
node "$AND/tools/make-icons.mjs" "$AND/res" "$SRC_WWW/assets/rockstar-logo.png" | sed 's/^/    /'

# ------------------------------------------------------------------ compile --
say "Compiling Java -> DEX"
# --release 8: dx predates invokedynamic, so keep the bytecode at Java 8.
quiet javac -nowarn -source 8 -target 8 -bootclasspath "$TOOLS/android.jar" \
      -classpath "$TOOLS/android.jar" \
      -d "$BUILD/classes" \
      $(find "$AND/src" -name '*.java') 2>&1 \
  | grep -v 'bootstrap class path\|source value 8\|target value 8\|deprecat\|Picked up JAVA_TOOL' || true

quiet java -cp "$TOOLS/dx.jar" com.android.dx.command.Main \
     --dex --min-sdk-version="$MIN_SDK" \
     --output="$BUILD/classes.dex" "$BUILD/classes"
echo "    classes.dex: $(stat -c%s "$BUILD/classes.dex") bytes"

# ------------------------------------------------------------------ package --
say "Packaging resources"
"$TOOLS/aapt" package -f \
  -M "$AND/AndroidManifest.xml" \
  -S "$AND/res" \
  -A "$BUILD/assets" \
  -I "$TOOLS/android.jar" \
  -F "$BUILD/resources.apk" \
  -0 arsc

python3 "$AND/tools/package-apk.py" \
  "$BUILD/resources.apk" "$BUILD/unsigned.apk" --add-dex "$BUILD/classes.dex" | sed 's/^/    /'

# --------------------------------------------------------------------- sign --
say "Signing"
if [ "${1:-}" = "--release" ]; then
  KEYSTORE="$2"; STOREPASS="$3"; ALIAS="$4"; KEYPASS="$5"
  echo "    release key: $KEYSTORE (alias $ALIAS)"
else
  KEYSTORE="$TOOLS/debug.p12"; STOREPASS="android"; ALIAS="rockstarshop"; KEYPASS="android"
  if [ ! -f "$KEYSTORE" ]; then
    echo "    creating debug keystore"
    quiet keytool -genkeypair -noprompt \
      -keystore "$KEYSTORE" -storetype PKCS12 -storepass "$STOREPASS" \
      -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10950 \
      -dname "CN=Rockstar Shop Debug, OU=Dev, O=Rockstar Shop, C=US" 2>/dev/null
  fi
fi

# The APK carries a v2 (APK Signature Scheme) signature only, so minSdk is 24.
#
# v1 (JAR) signing would widen support to Android 5-6, but apksig 2.3.0 - the
# newest build published to Maven Central, and Google Maven is unreachable from
# this build environment - signs v1 through sun.security.pkcs.PKCS7.
# encodeSignedData(OutputStream), which modern JDKs removed. Signing v1 with
# the JDK's jarsigner first does not help either: apksig 2.3.0 strips other
# signers' signatures and rejects setOtherSignersSignaturesPreserved with
# "not yet implemented". v2 alone is valid from Android 7.0 onward.

# Alignment has to happen before the signing block is appended.
python3 "$AND/tools/package-apk.py" \
  "$BUILD/unsigned.apk" "$BUILD/aligned.apk" --align | sed 's/^/    /'

# v2 signature - required to install on Android 11+ when targeting API 30+.
mkdir -p "$BUILD/signer"
quiet javac -nowarn "${JAVA_LEGACY_EXPORTS[@]}" \
      -classpath "$TOOLS/apksig.jar" -d "$BUILD/signer" "$AND/tools/ApkSign.java"
quiet java "${JAVA_LEGACY_EXPORTS[@]}" -cp "$TOOLS/apksig.jar:$BUILD/signer" ApkSign \
     "$BUILD/aligned.apk" "$BUILD/$APK_NAME" \
     "$KEYSTORE" "$STOREPASS" "$ALIAS" "$KEYPASS" "$MIN_SDK" | sed 's/^/    /'

# ------------------------------------------------------------------- verify --
say "Verifying"
quiet javac -nowarn "${JAVA_LEGACY_EXPORTS[@]}" \
      -classpath "$TOOLS/apksig.jar" -d "$BUILD/signer" "$AND/tools/ApkVerify.java"
quiet java "${JAVA_LEGACY_EXPORTS[@]}" -cp "$TOOLS/apksig.jar:$BUILD/signer" ApkVerify \
     "$BUILD/$APK_NAME" "$MIN_SDK" | sed 's/^/    /'
"$TOOLS/aapt" dump badging "$BUILD/$APK_NAME" | head -3 | sed 's/^/    /'

printf '\n\033[1;32m✔ APK ready:\033[0m %s (%s)\n\n' \
  "$BUILD/$APK_NAME" "$(du -h "$BUILD/$APK_NAME" | cut -f1)"
