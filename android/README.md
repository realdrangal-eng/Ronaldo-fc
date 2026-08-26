# Android builds

Packages a bundled web app into an installable APK. The app runs in a
full-screen `WebView`; its HTML, CSS, JS and art are bundled inside the APK, so
it works with no network and requests **no permissions at all**.

Two apps are configured, described by the files in [`apps/`](apps):

| App | Source | Package | APK |
| --- | --- | --- | --- |
| `gta6` | [`gta6/`](../gta6) — GTA VI: Vice Beach | `com.vicebeach.game` | `vice-beach.apk` |
| `rockstar-shop` | [`rockstar-shop/`](../rockstar-shop) — the storefront | `com.rockstarshop.store` | `rockstar-shop.apk` |

## Build

```bash
./android/build.sh gta6            # -> android/build/vice-beach.apk
./android/build.sh rockstar-shop   # -> android/build/rockstar-shop.apk
```

`gta6` is the default when no app is named. To add another, drop a `.conf` in
`apps/` naming the source directory, package id, label and icon — the WebView
shell in `src/` is shared.

First run downloads the toolchain (~30 MB) into `android/.tools/` and caches it.

Install on a device with USB debugging on:

```bash
adb install -r android/build/vice-beach.apk
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
./android/build.sh gta6 --release my-key.p12 storepass alias keypass
```

## Layout

```
android/
  AndroidManifest.template.xml  manifest template (@APP_PKG@, @APP_ORIENTATION@)
  apps/*.conf                   per-app: source dir, package, label, icon
  build.sh                      the whole build
  src/com/webapp/shell/         MainActivity — the shared WebView host
  tools/make-icons.mjs          renders the launcher icons
  tools/package-apk.py          DEX insertion, arsc storage, zip alignment
  tools/ApkSign.java            v2 signing via apksig
  tools/ApkVerify.java          signature verification via apksig
```

The manifest, `strings.xml`, launcher icons and the shell's background colour
are generated into `android/build/` from the chosen app config, so nothing
app-specific is checked in outside `apps/`.

`android/.tools/` (downloaded toolchain) and `android/build/` (output) are
untracked.

## Both apps

| | |
| --- | --- |
| min / target SDK | 24 (Android 7.0) / 34 |
| Permissions | none |
| Vice Beach APK | ~300 KB |
| Rockstar Shop APK | ~2.3 MB |

Pages persist state between launches through the WebView's DOM storage, and the
hardware back button walks WebView history before leaving the app.
