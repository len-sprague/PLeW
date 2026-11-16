# Handoff: PLeW streamlining work

For the next session picking this work up. Read this first, then the files it points to.

**Written:** 2026-11-16 · **Next task:** finding **A3** (specification in section 5).

---

## 1. What this work is

PLeW is a single-file HTML data visualizer for discrete data: one dot per record, arranged and styled by up to six columns. The owner's goals are accessibility, transparency and simplicity. The work so far documented the tool, listed where it falls short of those goals, and has started fixing the list one item at a time.

| Read this | For |
|---|---|
| `docs/03-design-guide.md`, Part 1 | Why the tool exists; the ten commitments every change is measured against |
| `docs/01-code-map.md` | How the code is organised: state, the two entry points, what depends on what |
| `docs/02-streamlining-report.md` | The list of findings (A1–A9, B, C, D, E, F), each with a suggested fix, risk and status |
| `docs/05-finding-test-files.md` + `docs/A*.csv` | A small CSV and exact steps that reproduce each group-A finding |
| `tools/code-userguide-review.md` | **The review procedure.** Required after every change (section 4 below) |
| `docs/04-user-guide.md` | What users are told; must stay true after each fix |

## 2. Where things stand

| Item | Status | Pull request |
|---|---|---|
| Documents (code map, report, design guide, user guide) | Merged | len-sprague/PLeW#28 |
| Test CSVs for A1–A9 | Merged | len-sprague/PLeW#28 |
| Guide pages on the site (`/guide/`, `/design/`, `/code-map/`), Help links, review procedure | Merged | len-sprague/PLeW#29 |
| **A1** panel filter with one value left | **Merged** | len-sprague/PLeW#30 |
| **A2** anchors marked with a reserved ID | **Merged** | len-sprague/PLeW#31 |
| **A3** hidden-record counts | **Next** | — |
| A4–A9 | Not started | — |

This file and `tools/checks/` come in their own pull request, opened after A2 was merged. No tool code is in it.

**Before starting A3, check that this file is on `main`** (`git fetch origin main && git ls-tree -r origin/main --name-only | grep HANDOFF`). If it is not, the handoff pull request is still open: ask the owner to merge it first, or start A3's branch from it.

**Before adding to a pull request, check that it is still open.** A commit pushed to a branch whose pull request has already been merged does not reach `main`; it needs a new pull request. (This happened with this very file.)

## 3. The files that matter

### The tool (two near-identical copies — every code change goes in both)

| File | Role |
|---|---|
| `layouts/index.html` | The editor: upload your own data. Called PRIMARY in the review procedure |
| `layouts/_default/example-viz.html` | The example page: data loaded from the page's front matter. Called EXAMPLE |

They differ only in the ways listed in code map §12. Everything else is duplicated by hand. One classic `<script>`, about 250 global functions, no modules, no build step.

### The site around it

| File | Role |
|---|---|
| `layouts/examples/list.html` | Example gallery |
| `layouts/_default/doc.html` | Frame for the three guide pages |
| `content/guide.md`, `design.md`, `code-map.md` | Five-line pages that pull their text from `docs/` — **edit the text in `docs/`, not here** |
| `layouts/shortcodes/doc.html`, `layouts/_default/_markup/render-link.html` | Pull a `docs/` file into a page; make its links work on the site |
| `content/examples/*.md`, `static/data/*.csv` | Example pages and their data |
| `hugo.toml`, `.github/workflows/hugo.yml` | Site settings; deploy on push to `main` with Hugo 0.128.0 |

The site is published in a sub-folder, `https://lensprague.com/PLeW/`. A link written as `{{ "/" | relURL }}` escapes that folder. Use `{{ site.Home.RelPermalink }}` for the home page and paths without a leading slash for everything else.

### Checking tools

| File | What it does |
|---|---|
| `tools/code-userguide-review.md` | The review procedure, step by step |
| `tools/checks/behaviour.js` | Drives the built site in a headless browser and prints 61 one-line checks (placements, filters, drag, undo, comments, compare, round trips, setup, report, an example page, every A-file) |
| `tools/checks/anchors.js` | 65 lines on anchors: every shipped dataset, every example page, save-and-reload cycles, edge-case files in `tools/checks/anchor-edge-cases/` |
| `tools/checks/links.js` | Tests every link on the editor, gallery, an example and the guide pages |
| `tools/checks/remap-line-numbers.py` | After an edit, moves every documented line number using the diff of the old and new file |
| `tools/checks/check-line-refs.py` | Checks every "`name` (line)" pair in the documents against the file |
| `docs/README.md` | Holds the **verification stamp** (section 4, step 8) |

## 4. How each fix is done

The owner set this process and has enforced it. Follow it exactly.

### Rules

1. **One branch, one pull request per fix.** Work on `claude/sleepy-davinci-qxvy5x` (or the branch the new session is assigned). After a pull request is merged, restart the branch from `origin/main` and push with `--force-with-lease`. The owner chose "one at a time on one branch", so do not open a second pull request while one is unmerged unless told to.
2. **Never push to `main`.** The owner reviews and merges every pull request.
3. **Title:** `A3 resolution attempt #1` (then `#2` if a second attempt is needed).
4. **Check in after each fix.** Open the pull request, summarise, and stop. Do not start the next finding until the owner says so.
5. **Ask before a fix that needs a design decision.** A2 needed one (how to mark anchors); the owner answered in a sentence. A3's is already answered (section 5).
6. **Say only what was executed.** The owner rejected "spot-checked" as insufficient. Every claim of verification must name the command or test that was run and what it showed. Use a system diff, not a sample.
7. **Plain, specific language** in pull requests and summaries. The owner is a researcher, not primarily a programmer.

### Steps

**1. Plan.** Read the finding in the report, its test file, and the code map sections it names. Decide the smallest change that fixes it.

**2. Build the unfixed site and record the "before".**

```bash
# Hugo 0.128.0 extended is not installed by default; fetch it once.
curl -sSL -o /tmp/hugo.tgz https://github.com/gohugoio/hugo/releases/download/v0.128.0/hugo_extended_0.128.0_linux-amd64.tar.gz
mkdir -p /tmp/hugo && tar xzf /tmp/hugo.tgz -C /tmp/hugo hugo

# Build main into one folder, served under /PLeW/ on port 8767.
mkdir -p /tmp/main_tree && git archive origin/main | tar -x -C /tmp/main_tree
(cd /tmp/main_tree && /tmp/hugo/hugo --destination /tmp/site_main --baseURL http://localhost:8767/PLeW/)
mkdir -p /tmp/srv_main && ln -sfn /tmp/site_main /tmp/srv_main/PLeW
(cd /tmp/srv_main && nohup python3 -m http.server 8767 >/dev/null 2>&1 &)

node tools/checks/behaviour.js 8767 > /tmp/before.txt
node tools/checks/anchors.js   8767 > /tmp/anchors.before.txt
```

Confirm the finding's failure is visible in the "before" record. A fix that was never seen failing has not been shown to work.

**3. Make the change in both tool files.** Apply the identical edit to each (a short script doing exact string replacement on both files, asserting each target string occurs exactly once, has worked well).

**4. Prove what changed.**

```bash
git diff --stat
git diff -U0 -- layouts/index.html layouts/_default/example-viz.html     # read all of it

# The two files must differ from each other exactly as they did before:
diff <(git show origin/main:layouts/index.html) <(git show origin/main:layouts/_default/example-viz.html) | grep '^[<>]' > /tmp/twin.before
diff layouts/index.html layouts/_default/example-viz.html | grep '^[<>]' > /tmp/twin.after
cmp /tmp/twin.before /tmp/twin.after && echo same
```

**5. Build the fixed site, record the "after", and diff.**

```bash
/tmp/hugo/hugo --destination /tmp/site --baseURL http://localhost:8765/PLeW/
mkdir -p /tmp/srv && ln -sfn /tmp/site /tmp/srv/PLeW
(cd /tmp/srv && nohup python3 -m http.server 8765 >/dev/null 2>&1 &)

node tools/checks/behaviour.js 8765 > /tmp/after.txt
node tools/checks/anchors.js   8765 > /tmp/anchors.after.txt
diff /tmp/before.txt /tmp/after.txt
diff /tmp/anchors.before.txt /tmp/anchors.after.txt
node tools/checks/links.js 8765
```

The lines that differ must be exactly the ones the fix was meant to change. Any other differing line is a regression until explained. Add lines to `behaviour.js` for anything the fix introduces, so later fixes are checked against it too.

Playwright and Chromium are preinstalled (`require('playwright')` works from any folder; do not run `playwright install`). The snapshot library's CDN and `wsrv.nl` are not reachable from the cloud environment, so snapshots cannot be exercised there; say so in the pull request.

**6. Two independent reviews by smaller agents**, run in parallel, each starting with no context, so the prompt must explain the tool, the bug, the fix, and how to drive the page:

- **Static review** — read both files; check the diff is identical in both; grep every identifier added or removed; walk the edge cases; syntax-check both scripts with `node --check`. Read-only.
- **Break-test** — given both served builds (fixed and unfixed), write its own scripts with its own independent calculation of the correct result, confirm its check fails on the unfixed build, then try to break the fix: odd values, empty values, every placement, drag and undo, setup export/import, role changes, JSON, example pages, a randomised run.

Act on what they find, re-run step 5, and report in the pull request what each found and what was done about it. Both A1 and A2 were improved by this step; A2's break-test found a real regression.

**7. Run the review procedure** in `tools/code-userguide-review.md` and update the documents:

- streamlining report: mark the finding ✅ fixed, keep its original description;
- `docs/05-finding-test-files.md`: keep the steps, add "what happens now", keep "what happened before";
- code map, user guide, design guide: remove or reword anything the fix has made untrue (the user guide's "Good to know" boxes and troubleshooting rows describe known faults, so several go stale with each fix);
- if lines were added or removed: `python3 tools/checks/remap-line-numbers.py <old index.html> layouts/index.html docs/01-code-map.md docs/02-streamlining-report.md docs/05-finding-test-files.md` — **once only** — then `python3 tools/checks/check-line-refs.py` and explain every pair it lists under "other" (four are expected: the second name in "`a` / `b` (n1, n2)" pairs);
- update line counts and the function count at the top of the code map.

**8. Refresh the verification stamp** in `docs/README.md`, last, when the code is final: the output of `git hash-object layouts/index.html layouts/_default/example-viz.html`, the line counts, the date and the reason.

**9. Rebuild, re-run the link check, commit, push, open the pull request, check in.**

The pull request description should contain: what was wrong; what was changed and where (function names, line numbers in both files); how the owner can test it by hand (file and steps); what was executed and what it showed (the diff of the records, pasted); what each reviewer found; limits and anything not tested; anything found along the way and not changed.

## 5. A3 — what the owner has decided

**Finding:** nothing on screen says how many records are hidden. See the report, A3, and `docs/A3-hidden-record-count.csv`.

**Decision:** use the wording the tool already uses for filtered values ("3 of 5 values").

| Place | When nothing is hidden | When something is hidden |
|---|---|---|
| Each panel's count (shown by **Show item counts**) | `3 items` | `2 of 3 items` |
| The header line above the picture | `8 records • …` | `4 of 8 records shown • …` |

**Anchors are not items and must not be counted in either number.** This is already true and must stay true:

- The header counts real records only (`data.length`, which is `currentData`) and reports anchors separately: `8 records • 0 modified • 2 anchors`.
- A panel's count is real records only. Anchors appear beside it, as `3 items (+1⚓)`, and only when the user has switched anchors on (**Anchor Points → Show on chart**). When anchors are off they are not in the picture and not in any count.
- The report (counts, percentages, crosstabs) uses real records only.

For A3, keep that separation: `2 of 3 items (+1⚓)`. Add a line to `behaviour.js` that checks a count with anchors visible.

**Things to settle while planning A3** (read the code, then decide or ask):

1. **A panel's total.** A panel is one grid X × grid Y combination. "3" in `2 of 3 items` should be every real record belonging to that panel; "2" the ones drawn. A record can be hidden by a panel X/Y filter, a colour or shape filter, or the comment filter. Today the panel count already drops records hidden by colour, shape and comment filters, and ignores panel X/Y filters; A3 makes all of them consistent.
2. **Records hidden with their whole panel.** A grid X or grid Y filter removes entire panels, so no panel label can report them. Only the header can. The header's "shown" number should therefore be the number of dots actually drawn.
3. **The header should probably also say why**, briefly (the design guide, principle 2: "whenever fewer rows are drawn than loaded, the screen says how many and why"). The report's suggestion was to name the active filters. Keep it short, or ask.
4. **Where the counts are computed.** `creategrid` builds the panel title before its cells are filled; the header is written at the top of `renderVisualization`. Counting drawn dots is simplest after rendering.
5. **Snapshots** include whatever the header and panel labels show; check a snapshot is not made worse.
6. **Label styling** ("Count size / Count color") applies to the panel count; a longer label must still fit.

## 6. Noted for later (not yet in the streamlining report unless stated)

Found while working on A1 and A2. None has been changed.

| Note | Detail |
|---|---|
| Example pages 21–29 load no data | Their `dataset_url` points at `data/21.csv` … `data/29.csv`; those files are not in `static/data/`. Predates this work. The owner has been told and has not yet asked for action |
| One anchor ambiguity remains by design | Real rows at the very end of a file with IDs exactly `a`, `b`, `c` … and values only in dimension columns are read as old-style anchors. Described in code map §7.4 and in the A2 pull request |
| Anchor IDs after a role change on the ID column | The renamed column moves to the end of the exported file (that is A4). Anchors are still recognised, because the reserved ID is found in any column |
| First and second download can order anchors differently | When dimension values mix upper and lower case and a column is entirely empty, the second download assigns anchor letters to values in a different order from the first; the set of anchors is identical and it is stable from the second download on. Same on the unfixed code. Cosmetic |
| `behaviour.js` line S10 prints `restored false` | A quirk of the check, not of the tool: exporting a setup fills in default value orders for every dimension, so the before and after states differ in form but not in effect. Same on every build, so it does not affect diffs. Worth correcting in the script |
| Anchors with a marker in the comment column | Only when every other column is a dimension. Such anchors then count as "has a comment" for the comment filter if anchors are switched on. Cosmetic |
| `layouts/backup-index.html`, `tools/*/local-visualizer.html` | Old copies of the tool (report C3, C4). They still contain the old anchor logic and are not maintained |

## 7. Suggested order for what remains

From the report, adjusted for what is done:

1. **A3** — hidden-record counts (specified above).
2. **A9** — do not contact the image proxy until a snapshot is requested. Small and self-contained.
3. **A5** — CSV parser: line breaks and quotation marks inside cells. Must come before A4.
4. **A4** — the exported CSV's shape: column order, optional comment column, optional anchors. Needs the owner's decisions.
5. **A8** (with B1) — one control in charge of placements. Needs the owner's decision.
6. **A6**, **A7** — colour keys and palette repeats. A6 needs a setup-file version bump.
7. Then groups D (unused code), C (merge the two tool files), B, E, F.

The owner may choose a different order; ask at each check-in.

## 8. Starting the next session

1. `git fetch origin main` and confirm this file and `tools/checks/` are on `main`. A1 and A2 are already merged.
2. Read this file, then the report's A3 row, `docs/05-finding-test-files.md` section A3, and code map §6.5 and §6.6.
3. Run step 2 of section 4 to get both builds serving and a "before" record.
4. Plan A3 against section 5, raise anything unclear with the owner, then proceed through section 4.
