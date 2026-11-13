# PLeW streamlining report

Where PLeW repeats itself, carries things it no longer uses, or behaves in a way that works against its own goals — with a suggested fix and a risk rating for each.

- **Scope:** `layouts/index.html` and `layouts/_default/example-viz.html`, plus the files around them. Line numbers are for `index.html` at commit `01f1fd4`.
- **Nothing in this report has been changed in the code.** Each item is a candidate for its own small pull request.
- Items marked *(verified)* were reproduced in a headless browser. The rest come from reading the code.
- Section references such as "map §6.5" point into the [code map](01-code-map.md).
- Findings A1–A9 each have a small CSV and step-by-step instructions that reproduce them: see [test files for findings A1–A9](05-finding-test-files.md).

**Risk** means the risk of making the change, given there is no test suite: **Low** = deletion or relabelling with no behaviour change; **Medium** = behaviour changes in one contained place; **High** = touches the load, render or export path.

---

## Summary

| Group | Items | Main gain |
|---|---|---|
| A. What you see is not quite what the data says | 9 | Trust. These matter most for a tool whose purpose is transparency |
| B. The same control in several places | 7 | A simpler interface |
| C. The same file in several places | 5 | One place to make each change |
| D. Unused and duplicated code | 12 | Roughly 250–300 fewer lines per file, easier reading |
| E. One thing, several names | 6 | Labels that explain themselves |
| F. Robustness | 5 | Fewer surprises with real-world files |

If only three things are done, the suggestion is **A1**, **A2** and **C1**.

---

## A. What you see is not quite what the data says

These are the items where the picture, the counts or the exported file can differ from what a user would reasonably expect. For a tool meant to make data interrogable, they come first.

| # | Finding | Where | Suggested fix | Risk |
|---|---|---|---|---|
| A1 | **Filtering a panel dimension down to one value shows every row again.** With three values on panel X, hiding one shows 4 of 6 rows; hiding two shows all 6, under the one remaining header *(verified)*. Dropping a dot into that cell then rewrites its value to the visible one. | `createpanelCell`, the `length > 1` tests at 6641, 6644. Map §6.5 | Remove the `length > 1` conditions. They are unnecessary: an unassigned slot is already handled by the `encodings.panelX &&` test. | Medium |
| A2 | **A file whose first column is lowercase words loads as zero records.** Trailing rows whose first cell is only `a–z` are taken to be anchor rows. A word list (`cat, dog, run…`) becomes 0 records and 4 anchors; a file ending in IDs `x`, `y` silently loses those rows *(verified)*. | `detectExistingDummies` 4659, `isAlphaLabel` 4655. Map §7.4 | Mark anchors explicitly instead of inferring them: a dedicated column (e.g. `res::plew_anchor`) or a reserved ID pattern such as `__anchor_a`. Keep reading the old form only when the trailing IDs are exactly `a, b, c…` in sequence. | High |
| A3 | **Nothing says how many records are hidden.** The header always reads "N records", whatever the filters. A viewer of a shared example cannot tell that a setup file has filtered rows out *(verified)*. Per-panel item counts also ignore panel X / panel Y filters *(verified)*. | `renderVisualization` 6311. Map §6.5 | Show "M of N records shown" whenever M ≠ N, and name the active filters next to it. | Low |
| A4 | **The exported CSV differs from the input even with no edits.** It gains a `desc::comment` column and the anchor rows *(verified)*. After a role change the column also moves to the far right, because the export takes column order from the first row object rather than from `csvHeaders` *(verified)*. | `generateCSV` 4190; `renameColumnKey` 5088 | Take column order from `csvHeaders`. Add the comment column only if any comment exists. Make "include anchor rows" a visible choice at download. | Medium |
| A5 | **Comments with a line break corrupt the file on re-import.** Export quotes them correctly, but the parser splits on line breaks before looking at quotes, so one row becomes two *(verified: 6 rows came back as 7)*. Doubled quotes (`""`) are also lost on import. | `parseCSV` 4078, `parseDelimitedLine` 4114 | Replace with a character-by-character parser that tracks quotes across lines and un-doubles `""`. About 30 lines. | Medium |
| A6 | **Custom colours and shapes follow the value, not the dimension.** A colour chosen for `0` under *Focus* is also used for `0` under any other dimension *(verified)*. | `customColorMap[value]` 4999, 5007, 6071, 6167 | Key by dimension and value (`key + '\u0000' + value`). Bump the setup version and read old files as before. | Medium |
| A7 | **Colours and shapes repeat without warning.** 10 colours and 4 shapes are cycled; an eleventh value shares a colour with the first, a fifth shares a shape. Reordering values also changes their default colours. | `getColorForValue`, `getShapeForValue` 4998–5012. Map §6.4 | Flag it in the legend when values outnumber the palette ("12 values, 10 colours: some repeat"). Consider fixing a value's default colour at load rather than by position. | Low / Medium |
| A8 | **Dragging the dimension list throws away dropdown choices.** The hint says to "use the dropdown to override", but the next drag reassigns every slot from list order *(verified)*. | `handleDimDrop` 5490 | Decide which control is in charge (see B1). | Medium |
| A9 | **Opening a record sends image addresses to a third party.** Images on another origin are fetched through `wsrv.nl` as soon as the record window opens, to prepare for a snapshot that may never be taken *(verified)*. | `preloadModalImages` 7279, `getSnapshotFetchUrl` 7245 | Fetch only when a snapshot is requested, and say so in the button's tooltip. | Low |

Smaller points in the same family:

- Columns whose name merely **contains** `name`, `title` or `description` (`filename`, `surname`, `subtitle_lang`) are never offered as dimensions *(verified)*. The tooltip uses the same substring test; the record window uses an exact match (3822 vs 3831). Suggest exact match everywhere. *Risk: Medium, changes which dimensions appear for existing data.*
- A column in which every row differs is silently dropped as an identifier (5038). Reasonable, but nothing in the interface says so. The Column roles list could show *why* each Auto column was treated as it was.
- A seventh enabled dimension is assigned to nothing, with no message (3059).
- The report ignores filters and layout (7454). That may be the right choice, but it should say "all N records" at the top.
- Ctrl+Z is captured even while typing in the comment box (4063), so it undoes the last data edit instead of the last keystroke.
- The anchor controls in the markup say "shown, opacity 0.05"; the state says "hidden, opacity 0", and the state wins at load *(verified)*. The slider cannot represent 0.

---

## B. The same control in several places

| # | Finding | Where | Suggestion | Risk |
|---|---|---|---|---|
| B1 | **Three ways to put a dimension in a slot**: list order, the dropdown, and the tick box (unticking equals choosing "—"). They overwrite each other (A8). | Dimensions section. Map §6.3 | Keep the **dropdown** as the one control that assigns. Let dragging only reorder the list, with auto-assignment reserved for load and **Reset**. Consider removing the tick box. | Medium |
| B2 | **Download CSV appears three times**, snapshot buttons twice, Report twice. | Changes box 2623, header 2881–2884, floating bar 2808–2823 | One "Export" group in the header: CSV, change log, setup, image, report. The floating bar can stay as the collapsed-sidebar mirror of that one group. | Low |
| B3 | **Column roles list appears twice**, sidebar and header dropdown, both fully editable. | 2650, 2840; `renderColumnRoleList` called for both | Keep one. The header dropdown is the less cluttered home. | Low |
| B4 | **Four live legends**: sidebar colour, sidebar shape, the "Show color & shape" bar, and the floating legend; a fifth is built for snapshots. Each has slightly different powers (edit colour / toggle filter / read-only). | 6041, 6094, 6185, 6254, 4289. Map §11 | One legend component with one behaviour, placed above the grid, reused for snapshots. Click the swatch to restyle, click the label to filter. | Medium |
| B5 | **Value filters can be toggled in two places** (sidebar ticks and legend-bar chips) for colour and shape, but only one for the other slots. | 5989, 6220, 6247 | Follows from B4. | — |
| B6 | **"Change color" means two things**: right-click changes the row's data; a legend swatch changes the palette. | 2942, 6065. Map §7.1 | Rename the context menu to say what it does: "Move to another *Confidence* value". | Low |
| B7 | **Display options are spread over three surfaces**: header bar (sizes, counts, names), toolbar (legend bar, clustering, comment filter), sidebar (anchors). | 2848–2880, 2889–2912, 2753 | Two groups with visible headings: **Show** (what is drawn) and **Layout** (how big). Filters belong with filters. | Low |

---

## C. The same file in several places

| # | Finding | Suggestion | Risk |
|---|---|---|---|
| C1 | **`index.html` and `example-viz.html` are about 7,500 identical lines** maintained by hand. They have already drifted: the audio MIME fix, the `.ogg` handling, the inner-label styling and three labels differ. Map §12 | Make them one file with two modes. The page decides at start-up: if a dataset URL is supplied (front matter, or a `?data=` query parameter), fetch it and hide the upload box; otherwise show the upload box. The Hugo layouts then both include the same partial, and the standalone-file idea is preserved. | High — do it as one mechanical step with no other changes, and compare behaviour before and after on each example |
| C2 | Until C1 is done, the drift itself is a bug list: port the audio MIME selection and `.ogg`-as-audio to `index.html`; port the wording and CSS-variable use one way or the other. | Three small edits. | Low |
| C3 | `tools/simple/local-visualizer.html` and `tools/heartbeat/local-visualizer.html` are byte-identical, and 3,500 lines behind the current tool. | Keep one copy beside both launchers, or generate it from the main file. | Low |
| C4 | `layouts/backup-index.html`, `layouts/shortcodes/visualizer-test.html`, `layouts/_default/full-visualizer.txt` are not referenced by any page. Git history already keeps them. | Move to `_archive/` or delete. | Low |
| C5 | `static/.DS_Store` is tracked although `.gitignore` lists it. `content/examples/.old_ex/` holds retired pages. | Remove from the index; archive. | Low |

---

## D. Unused and duplicated code

### Unused

| # | What | Where | Risk |
|---|---|---|---|
| D1 | `loadSampleData()` — commented "no longer called" | 7944 | Low |
| D2 | `moveValueInOrder()` — superseded by dragging | 3160 | Low |
| D3 | `openModal()`, `saveRecordComment()` — no callers | 7182, 3513 | Low |
| D4 | `clearSelection()` — a one-line alias of `clearCompareSlots()` | 7170 | Low |
| D5 | State never read: `preservedDimValues`, `selectedRowIndex`, `draggedDataPoint`; local `activeDims` (6307), which makes `getActiveDimensions()` unused too | 3978, 4007, 4018 | Low |
| D6 | `data-dim-value-key` / `data-dim-value` attributes set on headers but never read | 6337 | Low |
| D7 | `console.log` calls left in the load path | 7845, 7874, 7877 | Low |

### Duplicated

| # | What | Where | Suggestion | Risk |
|---|---|---|---|---|
| D8 | **Axis header construction, four times** (grid X, grid Y, panel X, panel Y): about 20 lines each | 6333–6382, 6560–6607 | One `createAxisHeader(key, value, {vertical, title})` | Medium |
| D9 | **Drop handlers for value reordering, twice**, differing only in a class name | 5537, 5575 (and the enter/leave/over trios) | One handler taking the selector | Low |
| D10 | **The four blocks in `handleCellDrop`**, one per slot, each also writing the change log by hand instead of calling `logChange` | 5661–5684 | Loop over `[['gridX', gridXVal], …]` | Medium |
| D11 | **"Download this text as a file", six times**; **CSV cell quoting, three times** | 4409, 4631, 3777, 7524, 4387, 7547; 4198, 4210, 4619 | `downloadBlob(blob, name)`, `csvCell(value)` | Low |
| D12 | `detectMediaColumns` has two branches with the same body; `processCSV` / `processJSON` are one-line wrappers; `changeColor` / `changeShape` differ by one word; three drag-list implementations (dimensions, columns, values) share a shape | 4448–4465, 7815–7822, 5792–5838 | Merge where it shortens the code without hiding intent | Low–Medium |

The stylesheet (2,580 lines) was not audited rule by rule. A pass for selectors that no longer match any element would be worthwhile once C1 is done, so it is done once.

---

## E. One thing, several names

| # | Finding | Suggestion |
|---|---|---|
| E1 | The outer layout is "grid", "outer panel" (`outerPanelRowHeight`) and "grid Grid" (the sidebar summary reads **"grid Grid: 3 × 2"**, 6031). The inner layout is "panel", "inner panel", "Inner Grid". Function names carry a search-and-replace scar: `creategrid`, `createpanelCell`, `toggleLabelStylegrid`, `uniformgridSizes`, class `grid-grid`. | Pick two words and use them everywhere, in labels first. Suggestion: **grid** (outer) and **panel** (inner), cells inside a panel are **cells**. |
| E2 | "Role" is used for both the column type and the encoding slot. Map §3 | Keep **role** for the column type; call the other **placement** or **shown as**. |
| E3 | Anchors are "Anchor Points", "Value Preservers", "anchors" and, in code, "dummy". | **Anchors** everywhere a user can see. |
| E4 | The setup is "setup", "Visualization setup", "config", "pre-calibrated setup". | **Setup** in the interface; `config` may stay in code. |
| E5 | The same slider is "Count size" in one file and "Inner panel size" in the other; it controls both the item count and, in the example file only, the inner axis labels. | Settle with C1/C2. |
| E6 | Buttons: "Load media files…" in the markup, "Load media folder…" once JavaScript has run (2608, 7810). Title: "📊 Data Editor" in the sidebar and header, "Multi-Dimensional Data Visualizer - Full Editor" in the tab; the name **PLeW** appears nowhere in the editor. | One name, one label. |

Renaming labels is low risk. Renaming identifiers is medium risk and is best left until after C1.

---

## F. Robustness

| # | Finding | Where | Suggestion | Risk |
|---|---|---|---|---|
| F1 | Data values are inserted as HTML in many places (tooltip, legends, dimension names, change log, snapshot legend). A value containing `<` breaks the display; `escapeHtml` exists but is used only in the record window and report. | e.g. 6958, 6219, 5897, 4591 | Use `textContent` or `escapeHtml` consistently. | Low |
| F2 | The whole grid is rebuilt for every change, including each tick of a colour picker (`input` event, 6070). Fine for hundreds of rows; sluggish for thousands. | `updateVisualization` | Not urgent. Use `change` instead of `input` for the picker; consider skipping sidebar re-renders when only data changed. | Medium |
| F3 | Dimension order, enabled set and slot assignment are keyed by display name; everything else by header. Two columns `X` and `dim::X` would collide. | Map §3 | Key everything by header. Needs a setup-version bump. | High |
| F4 | A setup saved after a role change only fully applies to the CSV exported with it, because headers changed. Mismatches are dropped silently. | Map §9 | On import, report what could not be applied ("2 filters skipped: column not found"). | Low |
| F5 | Export file names are fixed (`edited_data.csv`, `grid_snapshot.png`) while the setup file is named after the dataset. | 4413, 4391 | Name all exports after the dataset. | Low |

---

## Review against the code map

Each finding was checked back against the map to confirm that the suggested fix sits in one place and to see what else it touches.

| Finding | Map section | Touches | Self-contained? |
|---|---|---|---|
| A1 single-value panel filter | §6.5, §6.6 | `createpanelCell` only | Yes |
| A2 anchor detection | §5.1, §7.4 | Load path, export, `getRowDisplayId` | No — needs a format decision and backward reading |
| A3 hidden-record count | §6.5 | `renderVisualization`; needs a count of drawn dots, available after render | Yes |
| A4 export shape | §9 | `generateCSV`; interacts with A2 | Mostly |
| A5 CSV parser | §5.1 | `parseCSV`, `parseDelimitedLine`, `detectDelimiter` | Yes |
| A6 colour keys | §4.2, §9 | Four call sites plus setup read/write | Yes, with version bump |
| A8 / B1 slot assignment | §6.3 | `handleDimDrop`, hint text, possibly the tick box | Yes |
| A9 image proxy | §9 | One call in `renderCompareModal` | Yes |
| B2, B3, B7 control placement | §10 | Markup and a few render calls | Yes |
| B4 legends | §10, §11 | Five render functions, snapshot path | No — a small redesign |
| C1 one file, two modes | §12 | File handling, media URL resolution, start-up | No — the largest single change |
| D1–D7 unused code | §4.4 | Nothing else | Yes |
| D8–D12 duplication | §6.6, §7.1 | Render and drop paths | Yes, one at a time |
| E1–E6 naming | §3 | Labels only, at first | Yes |

**Suggested order**, so that each step makes the next one safer:

1. **D1–D7** — delete unused code in both files. No behaviour change; shrinks the diff for everything after.
2. **C2, C4, C5** — remove the known drift and the stray files.
3. **A1, A3, A9** — the three small trust fixes.
4. **C1** — merge the two files into one with two modes.
5. **A5, A4, A2** — parser, export shape, anchor marking (in that order: the parser must be right before the format changes).
6. **B1, E1–E6** — one way to assign a slot; one vocabulary.
7. **B2–B7** — regroup the controls and unify the legends.
8. **A6, F3** — re-key colours and dimension state, with a setup version bump.

A small set of fixture CSVs and a headless check (load, count dots, export, re-import) would make every step after the first much safer. The checks used to verify this report are a starting point.
