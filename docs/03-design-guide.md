# PLeW design guide

A manifesto and a working guide for anyone extending PLeW or building something in its spirit.

**Status: rough first draft.** The principles were drawn out of what the tool already does and what its code comments already insist on, then sharpened where the code falls short of them. The wording is meant to be edited; a writing style guide will follow. Where a principle is not yet met by the current tool, that is said plainly and linked to the [streamlining report](02-streamlining-report.md).

---

## Part 1 — Manifesto

### What PLeW is for

Research data about discrete things — utterances, items, judgements, recordings, categories — is usually met by its audience as a table of statistics. The numbers stand between the reader and the material. You are told that a difference is significant; you are not shown the forty recordings that make it up, and you cannot listen to the three that go the other way.

PLeW exists to take that barrier away. It puts every observation on the screen as a thing you can point at, open, hear, compare and question. It is meant for the researcher exploring their own data, and equally for the reader, student or colleague who wants to see what the researcher saw. Meaning should be something people build from the data together, in the open, not something handed down behind a summary.

### The commitments

**1. Every dot is an observation.**
One row of the data is one mark on the screen. PLeW does not average, bin, smooth or summarise in its main view. If there are 312 rows, there are 312 dots, and each one opens.

**2. Nothing is hidden without saying so.**
Any filter, any guess the tool makes about a column, any row left off the screen must be visible as such. The viewer should always be able to answer "am I looking at all of it?"

**3. Every control has one effect you can see.**
Change a setting and something on the screen changes at once, in a way that explains the setting. No control should need a manual to predict.

**4. One file.**
PLeW is a single HTML file that opens in a browser. No installation, no account, no server, no build. If it cannot be emailed, put on a USB stick, or kept working ten years from now, it is not PLeW.

**5. The data stays yours.**
Data is read in the browser and goes nowhere. What comes out is a plain file you can open in anything. The tool never becomes the only place your work lives.

**6. A playground with a paper trail.**
Moving things around is how you find out what you think. So moving is easy and always reversible — and every move is recorded, so that exploration can be shown to others and checked.

**7. Plain words.**
Labels say what a thing does in the words a newcomer would use. One idea has one name, everywhere.

**8. Simple by subtraction.**
A new option must earn its place by letting someone see something they could not see before. When two controls do the same job, one goes.

**9. Open to its readers as well as its authors.**
A shared link should give a reader the same powers of inspection the researcher had. Showing someone a view is an invitation to rearrange it.

**10. Readable all the way down.**
The source is part of the transparency. Someone curious enough to open the file should be able to follow it from top to bottom.

---

## Part 2 — Design guide

Each principle is followed by rules a contributor can check a change against, an example of the tool doing it well, and where it currently falls short.

### 1. Every dot is an observation

**Rules**

- The main view never draws a mark that stands for more than one row, or a row with no mark (unless filtered, see 2).
- Position, colour and shape are the only encodings. Each carries exactly one dimension. Anything not carrying a dimension — size above all — is held constant across the whole chart.
- Counts may sit beside the dots; they never replace them.
- Summaries (the report) are a separate, clearly labelled output, never the default view.

**Already true.** The dot-sizing code computes one size for the entire chart and its comment says why: *"Dot size is not an encoded dimension in this tool, so it must stay visually uniform … never a different size per cell."* When a cell is too crowded, dots overlap and a `+N` badge says how many are out of sight, rather than quietly shrinking or dropping them.

**Not yet.** When colours or shapes run out they repeat without warning (report A7).

### 2. Nothing is hidden without saying so

**Rules**

- Whenever fewer rows are drawn than loaded, the screen says how many and why.
- Every automatic decision — which columns are dimensions, which are media, which rows are anchors — is shown somewhere the user can see and override.
- A view loaded from someone else's setup shows that a setup is in force.
- If the tool cannot apply part of a setup, it says which part.
- Exported images carry their own legend.

**Already true.** Dimension rows read "3 of 5 values" when filtered. Snapshots have the legend added automatically. The Column roles badge counts how many columns are still on "Auto". Importing a setup made for a different dataset asks first.

**Not yet.** There is no "M of N records shown" (A3). A panel filter with one value left shows everything (A1). The reasons behind Auto column decisions are not shown. Anchor rows are inferred from the shape of the first column (A2).

### 3. Every control has one effect you can see

**Rules**

- One control, one piece of state, one visible consequence.
- The effect appears immediately; no Apply button.
- A control that currently can do nothing is hidden or disabled, not left live.
- Two controls never write the same state in ways that overwrite each other.
- The same gesture means the same thing wherever it is available.
- Changing how the data *looks* and changing the data *itself* must never be confusable.

**Already true.** Height boxes are disabled until their tick box is on. Sections of the sidebar appear only once they have something to act on. Dragging the ⋮ handle reorders values in the same way on axis headers and in the filter list.

**Not yet.** List order, dropdown and tick box all assign slots and override one another (A8, B1). "Change color" names both a data edit and a palette edit (B6).

### 4. One file

**Rules**

- HTML, CSS and JavaScript live together in one file with no build step. What is in the repository is what runs.
- Opening the file from disk must give a working tool. Hosting (Hugo, GitHub Pages) is a convenience wrapped around the file, never a requirement of it.
- No frameworks. Plain DOM and plain functions.
- An outside library is allowed only for an optional extra, and the tool must work fully when it fails to load. Today there is exactly one: html2canvas, for PNG snapshots.
- No network request is made unless the user's own data asks for it (a media link) or the user presses a button that plainly needs it.
- Variants of the tool are modes of the same file, not copies of it.

**Already true.** The editor contains two template expressions in nearly 8,000 lines and runs without Hugo once they are removed. Snapshot buttons check for the library and say so if it is missing.

**Not yet.** The editor and the example page are two hand-synchronised copies (C1). Opening a record contacts an image proxy before any snapshot is requested (A9).

### 5. The data stays yours

**Rules**

- Input and output are plain, open formats: CSV in, CSV out; JSON for settings.
- Loading and immediately exporting should give back the same table. Anything the tool adds is visible and optional.
- The data file is never needed to hold view settings, and the settings file never holds data. They travel separately.
- Meaning added by the user — roles, comments — is stored in the data file in a form a person can read in a spreadsheet (`dim::Function`, `desc::comment`).
- All values are treated as text. PLeW does not reinterpret, round or reformat what it was given.
- A file written by PLeW must be readable by PLeW.

**Already true.** Roles are header prefixes, readable anywhere. Comments are an ordinary column. The setup is a separate, human-readable JSON file with a version number, and reading it is forgiving of missing or extra parts.

**Not yet.** Export always adds the comment column and anchor rows and can reorder columns (A4). A comment containing a line break does not survive re-import (A5).

### 6. A playground with a paper trail

**Rules**

- Every change to the data can be undone, one step per gesture.
- Every change to the data is logged with what, where, from, to and when — including undos.
- The untouched original is kept for the whole session and can be restored.
- Edited rows are visibly marked.
- Destructive actions ask first.
- View changes are free: they are not logged and need no undo, because they change nothing.

**Already true.** A drag that changes three fields is one undo step. The change log records reversals too and exports as CSV or JSON. Modified dots carry a ring; Reset All asks for confirmation. Anchors exist so that emptying a category by dragging does not make the category disappear.

**Not yet.** Changing a column's role rewrites the kept original and cannot be undone. Ctrl+Z inside the comment box undoes a data edit rather than typing.

### 7. Plain words

**Rules**

- Use the reader's word, not the implementer's: *record*, *value*, *setup*, *anchor* — never *row index*, *level cardinality*, *config*, *dummy*.
- One concept, one word, in every label, hint, tooltip and document. Code may differ; what people read may not.
- A label names the effect ("Show only rows with comments"), not the mechanism.
- Every control that is not self-evident has a one-line tooltip.
- Hints sit next to the thing they explain and are short enough to read at a glance.
- Where the interface says something will happen, it happens.

**Proposed vocabulary** (to be settled with the style guide):

| Use | For | Avoid |
|---|---|---|
| record | one row of the data, one dot | item, point, row (in labels) |
| dimension | a column used to arrange or style dots | variable, factor, facet |
| value | one category of a dimension | level |
| grid | the outer arrangement of panels | outer panel, grid grid |
| panel | one box of the grid | sector, grid (for a single box) |
| cell | one position inside a panel | inner panel |
| column role | what kind of column it is | type, prefix |
| placement | where a dimension is shown (grid X, colour…) | role, encoding (in labels) |
| setup | the saved arrangement | config, calibration |
| anchor | a placeholder that keeps a value alive | dummy, value preserver |

**Not yet.** See report section E.

### 8. Simple by subtraction

**Rules**

- Before adding a control, ask: what can someone now see that they could not? If the answer is "the same thing, more conveniently", look for a control to remove instead.
- One home for each action. A second copy is justified only when the first is out of reach (the floating bar when the sidebar is closed).
- Defaults should produce a readable picture with no settings touched.
- Group controls by what the user is trying to do — load, arrange, filter, inspect, export — not by when the feature was written.
- Prefer a constant to an option. Make it an option only when real data has shown the constant to be wrong.
- Appearance options are the last to be added and the first to be questioned.

**Already true.** Loading a file produces a full picture with no configuration. The stacking parameters for crowded cells are deliberate constants, with a comment saying when they might become options.

**Not yet.** Download appears three times, the column list twice, the legend four times (B2–B4).

### 9. Open to its readers

**Rules**

- A shared example is the full tool with the data already loaded, not a reduced viewer.
- A reader's changes affect only their own session; reloading returns the author's view.
- An author can fix the starting view (a setup file) but cannot remove the reader's ability to change it.
- Sharing must not require coding: a data file, a few lines of description, a link.
- The tool should be usable with a keyboard and readable without relying on colour alone. Shape exists as a second channel for that reason.

**Already true.** Example pages run the same code as the editor. Adding one needs a CSV and an eight-line text file. Colour and shape can carry the same dimension.

**Not yet.** Most actions are mouse-only (drag, right-click, hover). The interface is dark-theme only apart from snapshots. Neither has been addressed.

### 10. Readable all the way down

**Rules for the source**

- The file reads top to bottom: configuration, state, input, analysis, drawing, interaction, output.
- All state is declared in one place, each variable with a line saying what it holds and what it is keyed by.
- State changes go through one redraw function. Derived things are recomputed, not kept in sync by hand.
- Each feature is fenced with start and end markers and can be read on its own.
- Functions are named for what they do, in the same vocabulary as the interface.
- No unused code. Git remembers; the file should not.
- A comment explains *why*, especially where a principle is at stake.
- Anything users see that is built from data is inserted as text, not as HTML.
- Format changes to the setup file bump its version and keep reading older versions.

**Already true.** Banner comments and `FEATURE:` markers; a single `STATE` section; `updateVisualization()` as the one redraw path; `processParsedRows()` as the one load path; the setup file carries `version` and `kind`.

**Not yet.** Feature markers are nested and some state is declared beside features; unused functions and variables remain (D1–D7); names still carry an old search-and-replace (E1).

---

## Part 3 — Checklist for a change

Before opening a pull request, a contributor should be able to answer yes to each of these.

**Seeing**
- [ ] Is every record still exactly one dot?
- [ ] If this hides, guesses or changes anything, does the screen say so?
- [ ] Does the new control have one effect, visible immediately?

**Keeping**
- [ ] If it changes data: is it undoable, logged, and marked?
- [ ] Does load → export still return what was loaded?
- [ ] Can a file exported after this change be loaded again?
- [ ] If the setup format changed: version bumped, old files still read?

**Simplicity**
- [ ] Does it let someone see something new — or does it duplicate a control that should be removed?
- [ ] Is the label in the agreed vocabulary, and does it name the effect?
- [ ] Does the default still give a good picture with nothing touched?

**The file**
- [ ] Still one file, no build step, opens from disk?
- [ ] No new network request, no new dependency?
- [ ] Applied to every mode of the tool (editor and example)?
- [ ] State declared in the STATE section; redraw through `updateVisualization()`?
- [ ] No unused code left behind; data inserted as text?

---

## Part 4 — For tools built on these ideas

PLeW is one answer for one kind of data: discrete observations with a handful of categorical properties and, often, media attached. The commitments travel further than the tool. Someone building for a different kind of data — time series, networks, text — could keep the following and change everything else:

1. Show the observations, not a summary of them.
2. Let anyone open any one of them.
3. Say what is hidden.
4. Make rearranging the view effortless, and make it the reader's right as much as the author's.
5. Keep a record of every change to the data.
6. Take plain files in, give plain files out, send nothing anywhere.
7. Stay small enough to be read, kept and handed on as a single file.

---

## Open questions

These need a decision from the project, not from a contributor.

1. **Should the standalone file drop Hugo entirely?** One file serving both the editor and example pages (via a `?data=` address parameter) would satisfy "one file" literally. Hugo would remain only to build the gallery.
2. **Is editing part of PLeW's identity, or one mode of it?** The sidebar is titled "Data Editor", yet most readers of a shared example will only explore. A read-only default for example pages, with editing one click away, may suit both.
3. **How far should the report go?** It is the one place PLeW produces statistics. It could stay as counts and crosstabs, tie itself to the current view, or be removed in favour of the picture.
4. **What is the upper size PLeW is meant for?** One dot per record sets a natural ceiling. Naming it (hundreds? a few thousand?) would settle several design arguments in advance.
5. **Light theme and keyboard access** — in scope for the next iteration or a later one?
