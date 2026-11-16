#!/usr/bin/env python3
"""Remap documented line numbers after an edit, using the diff between the old and new tool file.
Usage: git show origin/main:layouts/index.html > /tmp/old.html
       python3 tools/checks/remap-line-numbers.py /tmp/old.html layouts/index.html docs/01-code-map.md docs/02-streamlining-report.md docs/05-finding-test-files.md
Run ONCE per change (running it twice shifts numbers twice). Numbers that pointed at removed lines are listed and left alone."""
# Remap documented line numbers of layouts/index.html from the old file to the new one, using the diff between them.
import re, sys, difflib
old=open(sys.argv[1]).read().split('\n'); new=open(sys.argv[2]).read().split('\n')
sm=difflib.SequenceMatcher(None, old, new, autojunk=False)
m={}; first_change=None
for tag,i1,i2,j1,j2 in sm.get_opcodes():
    if tag=='equal':
        for k in range(i2-i1): m[i1+k+1]=j1+k+1
    else:
        if first_change is None: first_change=i1+1
        for k in range(i2-i1): m[i1+k+1]=None      # line was removed or rewritten
pat=re.compile(r'(?<![\d,.#/\-a-zA-Z_:])(\d{4})(?![\d]|,\d|px|\.\d|-\d\d)')
for f in sys.argv[3:]:
    s=open(f).read(); moved=0; lost=[]
    def rep(mo):
        global moved
        n=int(mo.group(1))
        if n<first_change or n>len(old): return mo.group(0)
        t=m.get(n)
        if t is None:
            lost.append(n); return mo.group(0)
        if t!=n: moved+=1
        return str(t)
    t=pat.sub(rep,s); open(f,'w').write(t)
    print(f, 'moved', moved, 'pointing at removed/rewritten lines (left as is):', lost)
print('first changed line in old file:', first_change, '| old', len(old)-1, 'new', len(new)-1)
