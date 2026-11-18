# Skill: review the PLeW documents against the code

**File:** `tools/code-userguide-review.md`
**Use it when:** you need to know whether the code map, the user guide and the other documents in `docs/` still describe what the PLeW tool actually does — and, after a code change, whether the tool still works.

This is a procedure. It is written so that any language model with shell access can follow it, and so that a human programmer can follow it too, by hand. It does not depend on any particular model, product or plug-in. The commands are ordinary `git`, `grep`, `diff`, `node` and Hugo.

---

## 0. Ground rules

Read these before anything else. They are what makes the review trustworthy.

1. **The code is the truth; the documents are claims about it.** When they disagree, the document is wrong unless the code is plainly broken, in which case report a *code defect* and do not edit the document to match the defect.
2. **Never accept a claim because it sounds right.** Every claim you mark as correct must be backed by something you looked at in this session: a line of code, a command's output, or an observed behaviour.
3. **Quote your evidence.** Each finding names a file and line, or the command that was run and what it printed.
4. **Say what you did not check.** "Not verified" is an acceptable result. A guess presented as a check is not.
5. **Review first, edit second.** Produce the report (step 8) before changing any document. Do not change tool code as part of this skill; code defects go in the report.
6. **Do the whole list.** Do not stop at the first few findings, and do not sample. If something cannot be done (no browser, no Hugo), say so in the report and carry on with the rest.
7. **Both tool files, every time.** PLeW currently has two near-identical copies. A claim checked against one must be checked against the other.

---

## 1. When to run it

| Situation | Run | Notes |
|---|---|---|
| A change to the tool is finished and reviewed, before its pull request is opened | **Full** (steps 2–9) | Required for every streamlining fix (A1, A2 … in `docs/02-streamlining-report.md`) |
| Someone asks "have the docs drifted?" | **Full** | |
| A document was edited but no code changed | **Quick** (steps 2, 3, 5 or 6 for the edited document, 8) | |
| Before a release or a round of new work | **Full** | |

A change to the tool is not complete until this skill has been run and its report is attached to, or summarised in, the pull request.

---

## 2. Find out what you are reviewing

Do not assume file names from this document. Discover them.

### 2.1 The tool files

```bash
# Every HTML file that contains the tool's redraw function is a copy of the tool.
grep -l "function updateVisualization" -r layouts tools _archive 2>/dev/null
```

Then decide which are **live** — used to build the site — and which are old copies:

```bash
grep -rn 'layout *= *"' content | sed 's/.*layout *= *//' | sort | uniq -c   # layouts named by content pages
ls layouts layouts/_default layouts/shortcodes
```

At the time of writing the live files are:

- **primary / editor:** `layouts/index.html`
- **example page:** `layouts/_default/example-viz.html`

If the list has changed (for example the two have been merged into one), use what you found and record it in the report. Call them **PRIMARY** and **EXAMPLE** below.

### 2.2 The documents

```bash
ls docs/*.md docs/*.csv README.md
```

| Document | What kind of claims it makes |
|---|---|
| `docs/01-code-map.md` | Structure: line ranges, function names, state variables, call order, dependencies, differences between PRIMARY and EXAMPLE |
| `docs/04-user-guide.md` | Behaviour as a user meets it: labels, steps, gestures, file names, troubleshooting |
| `docs/03-design-guide.md` | For each principle: "Already true" and "Not yet" statements about the tool |
| `docs/02-streamlining-report.md` | Findings, each with a location, a described failure and a status |
| `docs/05-finding-test-files.md` + `docs/A*.csv` | Step-by-step reproductions with exact expected and observed results |
| `README.md` | Set-up steps, column conventions, how to add an example |

The first three are also published as site pages (`content/guide.md`, `content/design.md`, `content/code-map.md`), which pull their text from `docs/` — there is only one copy of the text to check.

### 2.3 What changed since the documents were last verified

`docs/README.md` holds a **verification stamp**: the git blob hash of each tool file at the moment the documents were last checked. A blob hash depends only on a file's contents.

```bash
git hash-object layouts/index.html layouts/_default/example-viz.html   # current
grep -A6 "Verification stamp" docs/README.md                           # recorded
```

- **Hashes match the stamp:** the code has not changed since the last review. Only document edits need checking.
- **Hashes differ:** find the commit the stamp describes and get the exact change.

```bash
# Find the commit at which PRIMARY had the stamped hash.
STAMP=<hash from docs/README.md>
for c in $(git log --format=%H -- layouts/index.html); do
  [ "$(git rev-parse "$c:layouts/index.html")" = "$STAMP" ] && echo "$c" && break
done
# Then:
git diff <that commit> -- layouts/index.html layouts/_default/example-viz.html
```

Read that diff in full. Write down, in plain words, each thing that changed: functions added, removed or renamed; state variables; labels; default values; anything loaded or exported. **This list is your first set of suspects** — every item on it must be traced into the documents in steps 4–6.

If no stamp exists, or no commit matches, treat everything as unverified and do the full review.

---

## 3. Build an inventory from the code

Extract the facts mechanically, so that later steps compare document text against lists rather than against memory. Run each command for PRIMARY and for EXAMPLE. Save the outputs to a scratch folder outside the repository.

```bash
F=layouts/index.html     # then repeat with the EXAMPLE file

wc -l "$F"                                                     # total lines
grep -n '<style>\|</style>\|<body>\|<script>\|</script>' "$F"  # anatomy
grep -n '^ *// ====' -A1 "$F" | grep -v '====\|^--'            # section banners
grep -n 'FEATURE:' "$F"                                        # feature markers (must pair up: start/end)
grep -no 'function [A-Za-z0-9_]*' "$F"                         # every function and its line
grep -n '^        \(let\|const\) [A-Za-z_]' "$F"               # top-level state and constants
grep -no 'id="[^"]*"' "$F"                                     # element ids
grep -no 'on[a-z]*="[^"]*"' "$F"                               # inline handlers (onclick, onchange …)
grep -n 'addEventListener(' "$F"                               # listeners
grep -n "e\.key\|ctrlKey\|metaKey\|shiftKey" "$F"              # keyboard shortcuts
grep -n "\.download *= *" "$F"                                 # names of exported files
grep -n 'https\?://' "$F"                                      # every outside address the tool can contact
grep -n '{{' "$F"                                              # Hugo template expressions
```

Also extract, by reading the code rather than by grep:

- **The setup file's shape:** the object returned by `buildVisualizationConfig()` and the version constant beside it.
- **Visible labels:** the text of every button, tick box, section title, hint and tooltip in the `<body>`, and any label set from JavaScript (`textContent = '…'`, template strings).
- **The rules that decide a column's role:** the constants and the function that picks dimensions (`analyzeDimensions` at the time of writing).
- **The order of work at load** and **at redraw:** the body of the load entry point and the redraw entry point, call by call.

### 3.1 Checks on the code itself

These catch the commonest breakages from an edit. Run them every time, even if you were only asked about documents.

```bash
# (a) Functions defined but never used.
grep -o 'function [A-Za-z0-9_]*' "$F" | awk '{print $2}' | sort -u | while read n; do
  [ "$(grep -o "\b$n\b" "$F" | wc -l)" -le 1 ] && echo "unused: $n"; done

# (b) Functions called from the markup that do not exist.
grep -o 'on[a-z]*="[A-Za-z0-9_]*(' "$F" | sed 's/.*="//; s/($//' | sort -u | while read n; do
  grep -q "function $n\b" "$F" || echo "missing handler: $n"; done

# (c) getElementById / querySelector('#…') for ids that are not in the file.
grep -o "getElementById('[^']*')" "$F" | sed "s/.*('//; s/')//" | sort -u | while read i; do
  grep -q "id=\"$i\"\|\.id *= *'$i'" "$F" || echo "id not found: $i"; done

# (d) Feature markers that do not pair.
grep -o 'FEATURE: [a-z-]* (\(start\|end\))' "$F" | sort | uniq -c

# (e) The script parses. Copy the script body out with Hugo expressions replaced, then:
node --check extracted-script.js
```

For (c), an id reported as "not found" may be created in JavaScript under another pattern — look before reporting it.
For (d), every feature name should have equal numbers of `start` and `end`.
Compare (a) with the "Declared but not used" section of the code map and group D of the streamlining report: new entries are findings; entries that have gone should be marked resolved.

### 3.2 PRIMARY against EXAMPLE

```bash
diff layouts/index.html layouts/_default/example-viz.html > twin.diff
wc -l twin.diff
```

Sort every difference into one of three kinds:

1. **Intended** — it follows from the two files' different jobs (upload box, auto-loading a dataset, page title).
2. **Cosmetic** — spacing, comments.
3. **Drift** — a behaviour, label, default or fix present in one file and missing from the other.

Every *intended* and every *drift* difference must appear in the code map's "The two files" table. A difference missing from the table, or a table row with no matching difference, is a finding. **If the change under review touched only one of the two files, that is a finding of high severity** unless the pull request says why.

---

## 4. Check the code map, claim by claim

Open `docs/01-code-map.md` and go through it from the top. For each kind of claim, the test is:

| Claim | Test | Result when it fails |
|---|---|---|
| A line number or range (`3018–3116`, "at 6641") | Open that line. Is the named thing there? | Stale line reference |
| "N lines", "about N functions", any count | Recount from the inventory | Wrong count |
| A function, variable, constant, id or CSS variable by name | Is it in the inventory? | Renamed or removed |
| A section in the "script section order" table | Does a banner with that meaning exist, in that order? | Structure changed |
| A row of a state table: *written by* / *read by* / *keyed by* | `grep -n "\bname\b"` and read each hit | Wrong or incomplete |
| "Declared but not used" | Compare with check 3.1 (a) and with a usage count per variable | Out of date |
| The numbered load sequence and the redraw call tree | Read the function body, in order | Order or content changed |
| A rule ("a column is a dimension unless …", "a row is drawn when …") | Read the conditions in the code and restate each | Rule changed |
| The setup file's shape and version | Compare field by field with `buildVisualizationConfig()` | Field added, removed or renamed |
| An interface table row (control → function → state) | Find the control in the markup; follow its handler | Control moved, renamed or rewired |
| A dependency arrow ("changing X redraws Y") | Follow the calls from where X is set | Dependency changed |
| A row of "The two files" | Compare with `twin.diff` (step 3.2) | Drift |
| A row of "Other files in the repository" | `ls` the path; `grep` for references to it | File moved or removed |
| Anything marked *(verified)* | Reproduce it (step 7) | Behaviour changed |

Then check in the other direction — **what does the code have that the map does not mention?** Using the inventory: any new function group, state variable, feature marker, control, exported file, outside address or setup field with no mention in the map is a finding ("undocumented").

**Line numbers.** After any edit that adds or removes lines, every line reference below the edit is off. Either correct them all or none: a half-corrected map is worse than a consistently stale one. When many have moved by the same amount, correct them with one mechanical pass, and then **check every one, not a sample**: write a short script that takes each "name + line number" pair in the documents and tests that the name is on that line of the file, and list every pair that fails. Say in the report how many were checked, how many passed, and explain each one that did not.

---

## 5. Check the user guide, claim by claim

Open `docs/04-user-guide.md`. A reader will follow it literally, so exact wording matters.

1. **Every bold label** (**Show item counts**, **Export setup**, **Column roles ▾** …) must match the text on screen character for character, including symbols and capital letters. Search the markup and the label-setting JavaScript for each one. Check PRIMARY and EXAMPLE separately: where a label differs between them, the guide must say so or use the one a reader will meet in that context.
2. **Every table row** of the form "do this → get this": find the handler for the gesture and confirm the effect described. Pay attention to which fields a drag or right-click changes.
3. **Every stated default** ("ten colours and four shapes", "hidden by default", "the dimensions with the most values go to Grid X …"): find the constant or the assignment.
4. **Every file name** in "Saving your work": compare with the `.download =` lines from the inventory.
5. **Every keyboard shortcut**: compare with the key handler.
6. **Every "Good to know" box and every troubleshooting row** describes a known rough edge. For each, check whether the code still behaves that way. If a fix has landed, the box or row must be removed or reworded — a guide that warns about a bug that no longer exists misleads as much as one that omits a live bug.
7. **Part 2 (preparing data):** column prefixes, auto-recognised column names, accepted file types and media formats — compare with the constants and the file input's `accept` list.
8. **Part 3 (working on the tool):** file paths exist; the stated sequence for a data edit matches what the edit functions actually call; the manual checklist can still be carried out as written.
9. **Coverage:** every control in the inventory that a user can operate should be reachable from the guide. List any that are not mentioned.

Do the same for `README.md`: commands, paths, front-matter fields (compare with what the EXAMPLE layout reads from `.Params`), and any feature description.

---

## 6. Check the design guide, the report and the test files

### 6.1 Design guide (`docs/03-design-guide.md`)

Only two kinds of sentence here are checkable facts:

- **"Already true"** — each one names something the tool does. Confirm it still does.
- **"Not yet"** — each one names a shortfall, usually with a report number (A3, B1 …). Confirm it is still a shortfall. When a fix lands, the sentence moves from "Not yet" to "Already true" (reworded), or is removed.

The principles and rules themselves are decisions, not facts. Do not "correct" them. If a code change appears to break a principle, report that as a finding against the **code change**.

### 6.2 Streamlining report (`docs/02-streamlining-report.md`)

For every finding (A1 … F5):

1. Is the location still right (function name, line)?
2. Does the described failure still happen? For group A, use the test file (step 7). For groups B–F, read the code.
3. Record a status: **open**, **fixed** (name the commit or pull request), **partly fixed**, or **no longer applies**.

A fixed finding stays in the report, marked as fixed with a pointer to the change. Do not delete it: the report is also the record of what was wrong.

### 6.3 Test files (`docs/05-finding-test-files.md`, `docs/A*.csv`)

For each one, follow the written steps exactly (step 7 says how) and compare what happens with both the **Expected** line and the **What happens** line.

- Finding **open**: "What happens" must still match. If it does not, either something else changed the behaviour or the steps no longer work — find out which.
- Finding **fixed**: "Expected" must now be what happens. Update the page to say so: keep the steps, mark the finding fixed, and state the new observed result.

---

## 7. Run the tool

Reading code shows what should happen. Running it shows what does. Do both.

### 7.1 Get a page you can open

**Preferred — build the site** (the same way it is deployed; the version is in `.github/workflows/hugo.yml`):

```bash
hugo --destination /tmp/plew-site --baseURL http://localhost:8765/PLeW/
mkdir -p /tmp/plew-srv && ln -sfn /tmp/plew-site /tmp/plew-srv/PLeW
(cd /tmp/plew-srv && python3 -m http.server 8765) &
# Editor:        http://localhost:8765/PLeW/
# An example:    http://localhost:8765/PLeW/examples/zoo/
# Guide pages:   http://localhost:8765/PLeW/guide/  /design/  /code-map/
```

A build that prints `ERROR`, or a new `WARN` that was not there before the change, is a finding.

**Fallback — without Hugo.** Make a copy of PRIMARY with each `{{ … }}` expression replaced by a plain value (list them with `grep -n '{{'`), and open that file directly. Say in the report that Hugo was not used; the EXAMPLE file cannot be exercised this way because it fetches its dataset.

### 7.2 Drive it

Use a scriptable browser (Playwright, Puppeteer, or any equivalent) if one is available; otherwise a person follows the same steps by hand. Prefer operating the real controls — choose a file in the file input, select from a dropdown, tick a box, drag — over calling the tool's functions directly, because the documents describe controls, not functions.

Collect every uncaught page error and every failed request for the whole run. **Any uncaught error is a finding of the highest severity**, whatever else passed.

Useful things to read back from the page: the number of `.data-point[data-row-index]` elements (dots drawn), the text of `#vizStats` (the record line), the text of headers and legends, and — because the script is not a module — the tool's own globals such as `currentData.length`, `dummyRows.length`, `dimensionEncodings` and the result of `generateCSV()`. Re-derive these names from the inventory if they have changed.

### 7.3 Smoke test — after every code change

Run on PRIMARY and, where it applies, on an EXAMPLE page. Each line is pass or fail.

1. Page opens with no errors. EXAMPLE: the dataset loads and dots appear without any action.
2. Load `static/data/zoo.csv` in the editor. Record count and number of dots are equal and match the file's row count.
3. Give one dimension each of the six placements in turn; the picture redraws each time with no error and no lost dots.
4. Untick one value of a dimension on each kind of placement (grid, panel, colour); the dots that disappear are exactly those with that value. Tick it again; they return.
5. Drag a dot to another cell: its fields change; it gains the modified mark; the change log gains entries; **Undo** restores it; **Redo** reapplies it.
6. Right-click a dot and choose another colour value: same checks as 5.
7. Open a record, type a comment, close: the dot gains the comment mark; the comment is in the downloaded CSV.
8. Shift+click a second dot: the comparison table appears.
9. Download the CSV and load it again: same record count; anchors recognised.
10. Export the setup, reload the data, import the setup: placements, filters, value order and colours are as before.
11. Collapse and reopen the sidebar (key **B**): floating buttons and legend appear and disappear.
12. Open the report and generate it with one count and one crosstab.
13. Snapshot: if the snapshot library can be reached, a PNG is produced; if not, the tool says so rather than failing silently.
14. The three guide pages open, and the help links in the tool reach them. Then run the link check (7.6).
15. Touch (phones and tablets): in a phone-sized, touch-enabled page, a tap on a dot opens the record; pressing and holding a dot, sliding it to another cell and letting go changes its fields exactly as in 5; holding and letting go in place opens the colour / shape menu; a swipe scrolls and changes nothing. `tools/checks/touch.js` does all of this; a real phone is still worth trying, because emulation cannot show how a phone's browser treats a long press.

### 7.4 Finding reproductions

For each `docs/A*.csv`, follow its section in `docs/05-finding-test-files.md` step by step and record the observed result (see 6.3).

### 7.5 For a fix: prove it, then try to break it

**Record, then diff.** Put the checks of 7.3 and 7.4 in a script that prints one line per check, with the numbers observed. Run it on the code before the change and save the output; run it after and save that; then compare the two with `diff`. The lines that differ must be exactly the ones the fix was meant to change. Any other differing line is a regression until explained. Put the diff in the report.

When the review follows a fix for a specific finding:

1. **Before / after.** Run the finding's test file on the code before the change (`git stash`, or a build of the parent commit) and after. The failure must be present before and absent after. A fix that was never seen failing has not been shown to work.
2. **Neighbours.** List the functions the change touched and, from the code map's dependency section, everything that depends on them. Exercise each of those.
3. **Edges.** Try the cases the fix's author may not have: an unassigned placement; a dimension with one value; every value filtered out; an empty cell; anchors visible; a setup file imported after the action; the same action on the EXAMPLE page.
4. **Names.** For every identifier the change added or renamed, confirm it is defined once, spelled the same at every use, and — if it is state — reset on load and included in the setup file where it should be.

### 7.6 Link check

The site is published in a sub-folder (`/PLeW/`), and a link written as `/` leaves that folder and lands on the host's home page. This cannot be seen when the site is served from the root, so:

1. Build and serve the site **under a sub-folder**, as in 7.1.
2. Open each kind of page: the editor, the gallery, one example, and each guide page.
3. For **every** `<a href>` on each page, as the browser resolves it:
   - a link to the same host must stay inside the sub-folder, must return status 200, and, if it has a `#anchor`, an element with that id must exist on the target page;
   - a link to a file in the repository on GitHub (`…/blob/main/<path>`) must name a path that exists in the working tree;
   - any other outside link is listed in the report, and fetched if the network allows.
4. Report the number of links checked and every failure with its page, link text and address.

Also list every Hugo expression that builds an address (`grep -rn 'relURL\|absURL\|BaseURL\|RelPermalink' layouts`) and confirm each gives an address inside the sub-folder. In particular `{{ "/" | relURL }}` does **not**: a path that starts with `/` is returned unchanged. Use `{{ site.Home.RelPermalink }}` for the site's home, and paths without a leading slash (`{{ "guide/" | relURL }}`) for everything else.

### 7.7 Prove what an edit changed

A sample is not proof. After any edit — to code or to documents, by hand or by script — show the complete change with the system's own tools and read all of it:

```bash
git diff --stat                 # which files, how many lines
git diff -U0 -- <files>         # every changed line and nothing else
diff <(git show HEAD:layouts/index.html) layouts/index.html
```

For the two tool files, also confirm the edit was the same in both: the lines by which PRIMARY and EXAMPLE differ from each other must be the same before and after (save `diff PRIMARY EXAMPLE | grep '^[<>]'` at each point and compare the two results with `cmp`), unless the change was meant to alter that difference. In the report, state which of these commands were run and what they showed; do not describe a check that was not executed.

---

## 8. Write the report

Use this shape. Keep it factual; the reader will act on it without re-doing your work.

```markdown
# Document review — <date>

**Reviewed:** <PRIMARY path> (<blob hash>), <EXAMPLE path> (<blob hash>)
**Against:** docs as of commit <hash>
**Reason:** <"after fix A1", "routine", …>
**Method:** <Hugo build + scripted browser | static copy | reading only>
**Not done:** <anything skipped, and why>

## Result
<One or two sentences: are the documents accurate? Is the tool stable?>

## Code health
- Script parses: yes/no
- Uncaught errors during run: none / <list>
- Smoke test: <n>/15 passed — failures: <list>
- Missing handlers / ids, unpaired markers, new unused functions: <list or "none">
- PRIMARY vs EXAMPLE: <n> intended, <n> cosmetic, <n> drift — <list drift>

## Findings
| # | Severity | Document § | The document says | The code does | Evidence | Proposed change |
|---|---|---|---|---|---|---|

## Status of streamlining findings
| Finding | Status | Evidence |
|---|---|---|

## Undocumented
<Things in the code that no document mentions.>
```

**Severity**

| Level | Meaning |
|---|---|
| **Blocker** | The tool is broken: page error, lost data, a smoke-test failure, a fix that does not fix |
| **Wrong** | A reader following the document would be misled about what the tool does |
| **Stale** | A reference no longer points at the right place (line number, renamed function) but the meaning is still right |
| **Missing** | Something in the code that the documents should mention and do not |
| **Note** | Worth knowing; no change needed |

A review with no findings still produces the report, with the tables empty and the "Not done" line filled in.

---

## 9. Bring the documents up to date

Only if you were asked to, and only after the report exists.

1. Make the document edits the report proposes. Change what is wrong and nothing else: this is not the moment to rewrite prose.
2. Keep the documents' own vocabulary (see "Plain words" in the design guide).
3. In the streamlining report, mark fixed findings as fixed and name the pull request.
4. In the test-file page, update the observed results (step 6.3).
5. In the user guide and design guide, remove or reword warnings about behaviour that has been fixed (steps 5.6 and 6.1).
6. **Update the verification stamp** in `docs/README.md` with the current output of `git hash-object` for each tool file and today's date. Do this last, after the code is final. If the code changes again, the stamp is wrong again.
7. Rebuild the site and open the three guide pages once more: the published pages are made from these files.
8. Put the report, or a summary of it with the "Not done" line, in the pull request description.

---

## Checklist

For the reviewer to tick off, in order.

- [ ] Found the live tool files; did not assume them (2.1)
- [ ] Compared current blob hashes with the stamp; read the full diff since the stamp (2.3)
- [ ] Built the inventory for both files (3)
- [ ] Ran the five code checks (3.1)
- [ ] Classified every PRIMARY/EXAMPLE difference (3.2)
- [ ] Code map: every claim type tested; reverse check for undocumented items done (4)
- [ ] User guide and README: labels, steps, defaults, file names, warnings, coverage (5)
- [ ] Design guide: every "Already true" and "Not yet" (6.1)
- [ ] Streamlining report: a status for every finding (6.2)
- [ ] Test files: every one run (6.3, 7.4)
- [ ] Site built; smoke test run on both files; no uncaught errors (7)
- [ ] Link check run under a sub-folder; every link accounted for (7.6)
- [ ] Every edit shown in full with `git diff`; same change in both tool files (7.7)
- [ ] For a fix: failure seen before, absent after; neighbours and edges tried (7.5)
- [ ] Report written, including what was not done (8)
- [ ] Documents and stamp updated, site rebuilt (9) — if asked
