#!/usr/bin/env python3
"""Prefix media filenames in PLeW example CSVs with the CSV's own name.

PLeW resolves a relative media path against the site root, which is the
repo's static/ folder (see resolveExampleUrl in layouts/_default/example-viz.html
and "Sharing your own example dataset" in README.md). So for 21.csv, a cell
that says  ja_1-SNdb.wav  must say  21/ja_1-SNdb.wav  to find static/21/ja_1-SNdb.wav.

For every *.csv in a directory (in sorted order) this script finds the columns
that look like media columns, asks you whether to edit each one, and then
overwrites the CSV with "<csv-stem>/" prepended to the filenames in that column.

Cells that are left alone: empty cells, full URLs (http://, https://, //, data:,
blob: - including YouTube links), absolute paths starting with "/", and cells
that already start with "<csv-stem>/" (so re-running is safe).

Usage (copy your CSVs into a working folder, NOT the repo's static/data, then run from there):
    python prefix_media_paths.py                  # every *.csv in the current folder
    python prefix_media_paths.py path/to/folder   # every *.csv in another folder
    python prefix_media_paths.py --dry-run        # report only, write nothing

If a CSV isn't UTF-8 (e.g. saved by Excel), it is detected and saved back in the same
encoding; you're offered a conversion to UTF-8, or force one with --encoding (e.g. cp932).

Needs only Python 3 (standard library). The CSVs are overwritten in place, so keep a backup.
"""
import argparse
import csv
import io
import os
import re
import sys
import tempfile
from pathlib import Path

# Same header heuristics the visualizer uses (see MEDIA_URL_PATTERNS in example-viz.html).
MEDIA_HEADER_PATTERNS = [
    re.compile(r"^(audio|image|img|photo|picture|video|media|thumbnail|thumb|poster|clip|sound|track)[-_]?(url|file|src|path|link|href)$", re.I),
    re.compile(r"^(url|file|src|path|link|href)[-_]?(audio|image|img|photo|picture|video|media|thumbnail|thumb)$", re.I),
    re.compile(r"^(audio|image|img|video)$", re.I),
]
COLUMN_PREFIX = re.compile(r"^(dim|med|desc|res)::")
MEDIA_EXT = re.compile(r"\.(jpe?g|png|gif|webp|svg|bmp|ico|tiff?|mp4|webm|mov|avi|mkv|mp3|wav|ogg|oga|flac|aac|m4a|wma)$", re.I)
csv.field_size_limit(2**31 - 1)  # long transcripts shouldn't crash the reader
EXTERNAL = re.compile(r"^(https?:)?//|^(data|blob):", re.I)


def is_external(value):
    return bool(EXTERNAL.match(value)) or value.startswith("/")


def looks_like_media_header(header):
    """True if the header is a media column by the visualizer's rules (med:: prefix or name pattern)."""
    if header.startswith("med::"):
        return True
    name = COLUMN_PREFIX.sub("", header)
    return any(p.match(name) for p in MEDIA_HEADER_PATTERNS)


def candidate_columns(headers, rows):
    """Columns to offer: media-looking headers, plus any column whose values end in a media extension."""
    cols = []
    for i, h in enumerate(headers):
        if looks_like_media_header(h):
            cols.append((i, "header name"))
            continue
        if h.startswith(("dim::", "desc::", "res::")):
            continue
        values = [r[i].strip() for r in rows if i < len(r) and r[i].strip()]
        local = [v for v in values if not is_external(v)]
        if local and all(MEDIA_EXT.search(v) for v in local):
            cols.append((i, "cell contents look like media files"))
    return cols


def decode_bytes(raw, forced=None):
    """Return (text, encoding). The same encoding is used to save, so untouched bytes survive.

    Order tried: forced encoding, UTF-8 (with/without BOM), UTF-16 (BOM), Windows-1252
    (Excel's default on Western Windows), then latin-1, which decodes any byte.
    """
    if forced:
        return raw.decode(forced), forced
    if raw.startswith(b"\xef\xbb\xbf"):
        return raw.decode("utf-8-sig"), "utf-8-sig"
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw.decode("utf-16"), "utf-16"
    for enc in ("utf-8", "cp1252"):
        try:
            return raw.decode(enc), enc
        except UnicodeDecodeError:
            pass
    return raw.decode("latin-1"), "latin-1"


def non_ascii_sample(text, width=12):
    """A short snippet around the first non-ASCII character, so you can judge if decoding looks right."""
    for m in re.finditer(r"[^\x00-\x7f]+", text):
        return text[max(0, m.start() - width):m.end() + width].replace("\n", " ").replace("\r", " ")
    return None


def read_csv(path, forced=None):
    text, encoding = decode_bytes(path.read_bytes(), forced)
    newline = "\r\n" if "\r\n" in text else "\n"
    rows = list(csv.reader(io.StringIO(text, newline="")))
    return rows, encoding, newline, text


def write_csv(path, rows, encoding, newline):
    """Write to a temp file in the same folder, then swap it in, so a failure can't truncate the original."""
    buf = io.StringIO(newline="")
    csv.writer(buf, lineterminator=newline).writerows(rows)
    data = buf.getvalue().encode(encoding)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=path.name + ".", suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


def ask(question):
    while True:
        try:
            answer = input(question + " [y/n/q(uit)] ").strip().lower()
        except EOFError:
            answer = "q"
        if answer in ("y", "yes"):
            return True
        if answer in ("n", "no", ""):
            return False
        if answer in ("q", "quit"):
            print("Quitting; files already processed stay saved.")
            sys.exit(0)
        print("  Please type y, n, or q.")


def process(path, dry_run, forced_encoding=None):
    stem = path.stem
    root = stem + "/"
    print(f"\n=== {path.name}  (prefix: {root}) ===")
    rows, encoding, newline, text = read_csv(path, forced_encoding)
    non_utf8 = encoding not in ("utf-8", "utf-8-sig")
    unidentified = encoding == "latin-1" and not forced_encoding  # last-resort guess: bytes kept, text may look garbled
    if non_utf8:
        print(f"  Note: not UTF-8; read as {encoding}. Non-ASCII text looks like: {non_ascii_sample(text)!r}")
    if unidentified:
        print("  Couldn't identify this file's encoding, so its bytes will be saved unchanged. If you want it converted\n"
              "  to UTF-8, rerun with --encoding that matches it (e.g. cp932 Japanese, cp949 Korean, cp1251 Cyrillic).")
    if len(rows) < 2:
        print("  No data rows; skipping.")
        return
    headers, data = rows[0], rows[1:]
    cols = candidate_columns(headers, data)
    if not cols:
        print("  No media-looking columns found; skipping.")
        return

    changed = 0
    for i, why in cols:
        todo = [r for r in data if i < len(r) and r[i].strip()
                and not is_external(r[i].strip()) and not r[i].strip().startswith(root)]
        skipped = sum(1 for r in data if i < len(r) and r[i].strip()) - len(todo)
        print(f"\n  Column '{headers[i]}'  (detected by {why})")
        for r in todo[:3]:
            print(f"    e.g. {r[i].strip()}  ->  {root}{r[i].strip()}")
        print(f"    {len(todo)} cell(s) to change, {skipped} left alone (already prefixed / full URL / empty)")
        if not todo:
            continue
        if not ask(f"  Prefix '{headers[i]}' in {path.name} with '{root}'?"):
            continue
        for r in todo:
            r[i] = root + r[i].strip()
        changed += len(todo)

    if not changed:
        print("  Nothing changed.")
    elif dry_run:
        print(f"  [dry run] would update {changed} cell(s); file not written.")
    else:
        if non_utf8 and not unidentified and ask(f"  Save {path.name} as UTF-8 instead of {encoding}? (the website expects UTF-8; "
                            f"say n if the text above looks garbled)"):
            encoding = "utf-8"
        write_csv(path, rows, encoding, newline)
        print(f"  Saved {path.name} as {encoding} ({changed} cell(s) updated).")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("directory", type=Path, nargs="?", default=Path("."),
                    help="folder containing the CSV files (default: current folder)")
    ap.add_argument("--dry-run", action="store_true", help="show what would change, but don't write any file")
    ap.add_argument("--encoding", help="force how every CSV is read/saved, e.g. cp932 (Japanese Windows), "
                                       "cp949 (Korean), latin-1; default: auto-detect per file")
    args = ap.parse_args()

    if not args.directory.is_dir():
        sys.exit(f"Not a directory: {args.directory}")
    files = sorted(args.directory.glob("*.csv"))
    if not files:
        sys.exit(f"No .csv files in {args.directory}")
    print(f"Found {len(files)} CSV file(s) in {args.directory}")
    failed = []
    for path in files:
        try:
            process(path, args.dry_run, args.encoding)
        except KeyboardInterrupt:
            sys.exit("\nInterrupted; files already processed stay saved.")
        except Exception as e:  # keep going so one bad file doesn't stop the rest
            print(f"  ERROR: could not process {path.name}: {type(e).__name__}: {e}")
            failed.append(path.name)
    print("\nDone.")
    if failed:
        print("These files were NOT processed (see errors above): " + ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
