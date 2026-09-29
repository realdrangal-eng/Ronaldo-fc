#!/usr/bin/env python3
"""
Zip surgery for the APK build, in two modes:

  --add-dex <classes.dex>   insert the DEX into an aapt-produced APK
  --align                   store resources.arsc uncompressed and 4-byte-align
                            every stored entry

Alignment must run after v1 (jarsigner) signing, which rewrites the archive,
and before v2 signing. apksig inserts its signing block between the last local
entry and the central directory, so local offsets - and this alignment -
survive that step.

Usage: package-apk.py <in.apk> <out.apk> [--add-dex <classes.dex>] [--align]
"""

import struct
import sys
import zipfile

ALIGNMENT = 4
LOCAL_HEADER_SIZE = 30


def stored_data_offset(path, header_offset):
    with open(path, "rb") as fh:
        fh.seek(header_offset + 26)
        name_len, extra_len = struct.unpack("<HH", fh.read(4))
    return header_offset + LOCAL_HEADER_SIZE + name_len + extra_len


def verify_alignment(path):
    bad = []
    with zipfile.ZipFile(path) as zf:
        for info in zf.infolist():
            if info.compress_type != zipfile.ZIP_STORED:
                continue
            offset = stored_data_offset(path, info.header_offset)
            if offset % ALIGNMENT:
                bad.append((info.filename, offset))
    if bad:
        sys.exit("alignment check failed: %r" % bad[:5])


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit(__doc__.strip())

    src_path, out_path = args[0], args[1]
    dex_path = None
    align = False

    i = 2
    while i < len(args):
        if args[i] == "--add-dex":
            dex_path = args[i + 1]
            i += 2
        elif args[i] == "--align":
            align = True
            i += 1
        else:
            sys.exit("unknown option: %s" % args[i])

    with zipfile.ZipFile(src_path, "r") as src, \
         zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as out:

        entries = [(info.filename, info.date_time, info.external_attr,
                    info.compress_type, src.read(info.filename))
                   for info in src.infolist()]

        if dex_path:
            with open(dex_path, "rb") as fh:
                entries.append(("classes.dex", (2024, 1, 1, 0, 0, 0),
                                0o644 << 16, zipfile.ZIP_DEFLATED, fh.read()))

        stored = 0
        for name, date_time, external_attr, compress, data in entries:
            if align and name == "resources.arsc":
                # Must be uncompressed for targetSdk >= 30.
                compress = zipfile.ZIP_STORED

            zi = zipfile.ZipInfo(name, date_time=date_time)
            zi.compress_type = compress
            zi.external_attr = external_attr
            zi.create_system = 0

            if align and compress == zipfile.ZIP_STORED:
                offset = out.fp.tell() + LOCAL_HEADER_SIZE + len(name.encode("utf-8"))
                zi.extra = b"\x00" * (-offset % ALIGNMENT)
                stored += 1

            out.writestr(zi, data)

    if align:
        verify_alignment(out_path)
        print("aligned %s (%d entries, %d stored+aligned)"
              % (out_path, len(entries), stored))
    else:
        print("packaged %s (%d entries)" % (out_path, len(entries)))


if __name__ == "__main__":
    main()
