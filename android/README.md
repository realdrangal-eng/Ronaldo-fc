# Rockstar Shop — Android build

Packages the storefront in [`rockstar-shop/`](../rockstar-shop) into an
installable APK. The store runs in a full-screen `WebView`; the HTML, CSS, JS
and cover art are bundled inside the APK, so the app works with no network and
requests **no permissions at all**.

## Build

```bash
./android/build.sh
# -> android/build/rockstar-shop.apk
```

First run downloads the toolchain (~30 MB) into `android/.tools/` and caches it.

Install on a device with USB debugging on:

```bash
adb install -r android/build/rockstar-shop.apk
```

or copy the APK to the phone and open it (needs "install unknown apps").

## Toolchain

There is no Android Studio, Gradle plugin or Android SDK involved — Google's
SDK host is unreachable from this build environment, so `build.sh` assembles a
toolchain from public artifacts instead:

| Piece | Role | Source |
| --- | --- | --- |
| `aapt` | compiles resources, encodes the manifest, packages the APK | bundled inside `org.apktool:apktool-lib` (Maven Central) |
| `android.jar` (API 34) | platform stubs to compile and link against | `Sable/android-platforms` on GitHub |
| `dx` | Java bytecode → Dalvik DEX | `com.jakewharton.android.repackaged:dalvik-dx` (Maven Central) |
| `apksig` | v2 APK signing and verification | `com.android.tools.build:apksig` (Maven Central) |
| `javac`, `keytool` | compile, debug keystore | JDK 21 |

`tools/package-apk.py` does the zip surgery `zipalign` would normally handle:
inserts `classes.dex`, stores `resources.arsc` uncompressed (required for
`targetSdk >= 30`) and 4-byte-aligns every stored entry. Alignment runs before
signing — apksig appends its block between the last local entry and the central
directory, so local offsets survive.

## Signing

The build is signed with **v2 only**, hence `minSdkVersion 24` (Android 7.0).

v1 (JAR) signing would extend support back to Android 5, but apksig 2.3.0 — the
newest build on Maven Central, and Google's Maven host is blocked here — signs
v1 through `sun.security.pkcs.PKCS7.encodeSignedData(OutputStream)`, which
modern JDKs removed. Signing v1 with the JDK's own `jarsigner` first doesn't
help: apksig 2.3.0 strips other signers' signatures and rejects
`setOtherSignersSignaturesPreserved` as "not yet implemented". A v2-only APK is
valid from Android 7.0 onward, which is what `minSdkVersion` now declares.

Debug builds use a throwaway keystore at `android/.tools/debug.p12` (untracked,
created on first build). For a real signing key:

```bash
./android/build.sh --release my-key.p12 storepass alias keypass
```

## Layout

```
android/
  AndroidManifest.xml          package, SDK levels, launcher activity
  build.sh                     the whole build
  res/values/strings.xml       app name
  res/mipmap-*/                launcher icons (generated from the Rockstar logo)
  src/com/rockstarshop/store/  MainActivity — the WebView host
  tools/make-icons.mjs         renders the launcher icons
  tools/package-apk.py         DEX insertion, arsc storage, zip alignment
  tools/ApkSign.java           v2 signing via apksig
  tools/ApkVerify.java         signature verification via apksig
```

`android/.tools/` (downloaded toolchain) and `android/build/` (output) are
untracked.

## App details

| | |
| --- | --- |
| Package | `com.rockstarshop.store` |
| Label | Rockstar Shop |
| min / target SDK | 24 / 34 |
| Permissions | none |
| APK size | ~2.3 MB |

The cart persists between launches through the WebView's DOM storage, and the
hardware back button walks WebView history before leaving the app.
