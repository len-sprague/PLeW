#!/usr/bin/env python3
"""Check every "`name` (line)" reference in the documents against layouts/index.html.
Usage (from the repository root):  python3 tools/checks/check-line-refs.py
A pair passes if the name is on that line, or the line is inside the function of that name.
Pairs listed under "other" must each be explained (e.g. "`a` / `b` (n1, n2)" gives the first number to the second name)."""
import re
src = open('layouts/index.html').read().split('\n')
tot = exact = inside = 0; other = []
for f in ['docs/01-code-map.md', 'docs/02-streamlining-report.md', 'docs/05-finding-test-files.md']:
    s = open(f).read()
    for m in re.finditer(r'`(\w+)(?:\(\))?`[ ]?\(?(?:lines? )?(\d{4})', s):
        name, n = m.group(1), int(m.group(2)); tot += 1
        if n > len(src): other.append((f, name, n, 'past end of file')); continue
        if name in src[n-1]: exact += 1; continue
        start = next((i for i in range(n-1, -1, -1) if re.match(r'        (async )?function \w+', src[i])), None)
        if start is not None and ('function ' + name) in src[start]: inside += 1
        else: other.append((f, name, n, src[n-1].strip()[:60]))
print('pairs', tot, '| on the named line', exact, '| inside that function', inside, '| other', len(other))
for x in other: print('  ', x)
