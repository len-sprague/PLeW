# PLeW code map

How the pieces of PLeW relate to each other in the code.

- **Subject:** `layouts/index.html` (the full editor, 8,102 lines) and its near-twin `layouts/_default/example-viz.html` (the example pages, 7,893 lines).
- **Line numbers** refer to `layouts/index.html` as recorded in the verification stamp in [docs/README.md](README.md). They will drift; the section banners and `FEATURE:` markers named below are the stable way to find things.
- **Status:** first draft. Everything here was read from the code; the behaviours marked *(verified)* were also confirmed by running the page in a headless browser.

Companion documents: [streamlining report](02-streamlining-report.md), [design guide](03-design-guide.md), [user guide](04-user-guide.md).

---

## 1. The one-paragraph model

PLeW takes a table of rows. Each column is given a **role** (dimension, description, media, reserved, or auto-guessed). Every dimension is a discrete variable with a small set of **values**. Up to six dimensions are each assigned to one **encoding slot**: grid X, grid Y, panel X, panel Y, colour, shape. The screen is then a grid of panels (grid X × grid Y), each panel is a small grid of cells (panel X × panel Y), and each row of the table is one dot in exactly one cell, coloured and shaped by its values. Nothing is aggregated: one row is always one dot. Dragging a dot to another cell rewrites that row's values, and every such edit is undoable, logged and exportable.

Everything else in the file exists to serve one of four jobs around that model: **getting data in**, **deciding what is shown**, **inspecting or editing a row**, and **getting results out**.

## 2. Anatomy of the file

| Lines | What | Notes |
|---|---|---|
| 1–7 | `<head>` | One external script: html2canvas 1.4.1 from cdnjs (used only for PNG snapshots). |
| 8–2589 | `<style>` | All CSS, about a third of the file. Dark theme, colours hard-coded. Six CSS variables carry user-adjustable styling (§9). |
| 2591–3016 | `<body>` markup | Static skeleton: sidebar, main area, tooltip, context menu, two modals. Most content is filled in by JavaScript. |
| 3018–8100 | `<script>` | One classic script, about 247 top-level functions, all global. No modules, no classes, no build step. |

Hugo is used only as a thin wrapper. `index.html` contains five template expressions (the examples link at 2598, three help-page links at 2600, and `SITE_BASE` at 3022); `example-viz.html` adds `.Title`, `.Description`, `dataset_url` and `config_url`. Remove those and the file runs from disk.

### Script section order

The script is laid out in banner-commented sections, with newer work wrapped in `// --- FEATURE: name (start/end) ---` markers.

| Lines | Section | Role |
|---|---|---|
| 3019–3117 | CONFIGURATION | Palettes, encoding slots, column-name conventions |
| 3119–3233 | value order + value filter helpers | Read/write `dimensionValueOrder`, `dimensionValueFilters` |
| 3246–3520 | row-comments | The `desc::comment` column, tag presets, comment filter, editor |
| 3560–3817 | viz-config-io | Export / import of the setup JSON |
| 3819–3935 | column visibility, record field order, modal title | |
| 3937–3952 | media detection patterns | |
| 3954–4023 | STATE | Every global variable |
| 4025–4073 | sidebar toggle, keyboard shortcuts | |
| 4075–4182 | CSV and JSON parsing | |
| 4184–4419 | CSV export, grid snapshot | |
| 4421–4540 | media column detection and URL resolution | |
| 4542–4641 | change log | |
| 4643–4927 | anchor ("dummy") rows | |
| 4929–5091 | change tracking, undo / redo | |
| 5093–5114 | colour and shape lookup | |
| 5116–5154 | dimension analysis | Which columns become dimensions |
| 5156–5469 | column-roles | Role editor, column rename, rebuild |
| 5478–5556 | `updateVisualization()` | The single redraw entry point |
| 5558–5803 | drag and drop: dimensions, values, data points | |
| 5805–5972 | right-click context menu | |
| 5974–6406 | sidebar and legend rendering | |
| 6408–6825 | grid rendering | `renderVisualization` → `creategrid` → `createpanelCell` |
| 6827–6996 | adaptive dot sizing | |
| 6998–7147 | data point, tooltip | |
| 7149–7385 | record modal, compare, media HTML | |
| 7387–7495 | image inlining for modal snapshots | |
| 7497–7680 | report | |
| 7682–7791 | modal snapshot, modal close | |
| 7793–7963 | FILE HANDLING | Drop zone, file inputs, local media map |
| 7965–8089 | `processParsedRows()` | The single load entry point |

### Feature markers

| Marker | What it covers |
|---|---|
| `encoding-dropdown` | Per-dimension slot dropdown and `buildEncodings()` |
| `value-order-drag` | Custom order of a dimension's values, by dragging |
| `filters-plus` | All / None buttons, "3 of 5 values" label, colour/shape row filter |
| `row-comments` | Comments, tags, comment filter (nested inside `filters-plus`) |
| `viz-config-io` | Setup export / import |
| `column-roles` | Role editor, record-window field visibility and order |
| `record-compare` | A/B slots and the comparison table (nested inside `column-roles` at one point) |
| `grid-toolbar` | The bar above the grid: comment filter, legend bar, clustering |
| `json-loader` | JSON / JSONL input |
| `snapshot-plus` | Legend in grid snapshots, image inlining, light theme |

Older features (parsing, anchors, undo, change log, report, rendering) have banners but no markers.

## 3. Vocabulary

The code, the interface and the README do not always use the same word for the same thing. This table is the translation.

| Concept | In the interface | In the code |
|---|---|---|
| A row of the table | record, item, row, point | `row`, `currentData[i]`, `.data-point` |
| A column used for layout | dimension | `allDimensions[]` entries `{name, key, uniqueValues, cardinality}` |
| A distinct value of a dimension | value, level | `uniqueValues`, "value" |
| Where a dimension is shown | role (dimension list), "Grid X/Y, Color…" | *encoding*; slot keys `grid-x` … `shape`; fields `gridX` … `shape` |
| What kind of column it is | column role | *role* / *prefix*: `dim`, `desc`, `med`, `res`, `auto` |
| Outer layout | grid, "Unify grid sizes" | `.grid-grid` (whole), `.grid` (one outer cell), `creategrid()` |
| Inner layout | panel, inner panel, inner grid | `.panel-grid`, `.panel-cell`, `createpanelCell()` |
| Placeholder rows | Anchor Points, Value Preservers | `dummyRows`, `_isDummy`, `dummySettings` |
| Saved view settings | setup, "Visualization setup" | *config*, `plew-visualization-config` |
| Row detail window | record, record window | *modal*, `#modalOverlay` |

Two things to keep straight when reading the code:

1. **"Role" means two different things.** In the *Column roles* list it is the column's type. In the *Dimensions* list tooltip ("Visual role for this dimension") it is the encoding slot.
2. **A dimension has a `name` and a `key`.** `key` is the real column header (`dim::Function`); `name` is the header with any prefix removed (`Function`). `dimKey(dim)` (3115) returns the key. Row lookups, filters and value order use the **key**. Dimension order, the enabled set and encoding assignment use the **name**.

## 4. State

All state is in global `let` variables declared at 3957–4023, plus a few declared beside their feature. There is no state object and no change notification; functions mutate these directly and then call `updateVisualization()`.

### 4.1 Data

| Variable | Holds | Written by | Read by |
|---|---|---|---|
| `currentData` | Working rows. Each row is `{_index, <header>: string, …}` | `processParsedRows`, every edit, `undo`/`redo`, `resetAllChanges`, `renameColumnKey` | Almost everything |
| `originalData` | Deep copy taken at load | `processParsedRows`, `renameColumnKey`, `ensureCommentColumn` | `undo` (is a row still modified?), `resetAllChanges` |
| `csvHeaders` | Column headers in file order, plus `desc::comment` | `processParsedRows`, `renameColumnKey`, `ensureCommentColumn` | Column roles, anchors, `getRowDisplayId` (first header = row ID) |
| `dummyRows` | Anchor rows, kept apart from real data | `processParsedRows`, `rebuildDimensionsAfterColumnRoleChange` | Rendering (if visible), `generateCSV` |
| `mediaColumns` | `[{column, type}]` | `detectMediaColumns` at load and on role change | `getRowMedia` |
| `csvBaseUrl`, `localMediaMap` | Where to resolve relative media paths | File handling | `resolveMediaUrl` |
| `currentDatasetId` | File name of the loaded data | `processDataFile` | Setup export name, mismatch warning on import |

Fields starting with `_` (`_index`, `_isDummy`) are internal and are skipped everywhere fields are listed or exported.

### 4.2 View

| Variable | Keyed by | Holds |
|---|---|---|
| `allDimensions` | — | The dimension objects, sorted by number of values, largest first |
| `userDimensionOrder` | name | Order of the dimension list |
| `enabledDimensions` | name | Set of ticked dimensions |
| `dimensionEncodings` | name | `{ name: slotKey }`, the source of truth for assignment |
| `encodings` | — | **Derived** by `buildEncodings()` on every redraw: `{gridX, gridY, color, panelX, panelY, shape}` → dimension object |
| `dimensionValueFilters` | key | `{ key: Set(visible values) }`. No entry means everything visible |
| `dimensionValueOrder` | key | `{ key: [values in user order] }` |
| `customColorMap`, `customShapeMap` | **value only** | Overrides of the default palette |
| `columnVisibility`, `columnRecordOrder` | header | Which fields the record window shows, and in what order |
| `commentPresetLabels`, `showCommentsOnly`, `commentVisibleTags` | — | Comment tags and the comment filter |
| `dummySettings` | — | `{visible, color, opacity, shape}` for anchors |
| `showItemCounts`, `showDimensionNames`, `clusterPoints`, `showEncodingLegend`, `uniformgridSizes`, `unifyInnerPanel` | — | Display toggles |
| `compareSlots` | — | `{a, b}` row indices open in the record window |
| `modalSnapshotLight` | — | Theme for record snapshots |

Several display settings have **no state variable** and live only in their form control: label size and colour, count size and colour, the two row-height numbers. They are read from the DOM when needed (`applyLabelStyle`, `getOuterPanelRowHeight`, `buildVisualizationConfig`).

### 4.3 Edit history

| Variable | Holds |
|---|---|
| `modifiedRows` | Set of row indices that differ from `originalData` |
| `undoStack`, `redoStack` | Actions `{type, changes:[{rowIndex, field, oldValue, newValue}]}`; at most 100 |
| `changeLog` | Append-only list `{rowId, rowIndex, field, oldValue, newValue, timestamp}`; undo and redo are logged too |

### 4.4 Declared but not used

`preservedDimValues` (written twice, never read), `selectedRowIndex` (written five times, never read), `draggedDataPoint` (written, never read). See the streamlining report.

## 5. The two entry points

Almost every path through the code passes through one of two functions.

### 5.1 Load: `processParsedRows()` (7984)

```
drop / file picker ──► loadFile ──► processDataFile ──┬─► parseCSV ──┐
example page fetch(DATASET_URL) ──────────────────────┴─► parseJSON ─┴─► processParsedRows
```

In order, it:

1. Adds the `desc::comment` column if missing.
2. `detectMediaColumns(headers)` → `mediaColumns`.
3. `detectExistingDummies` — separates anchor rows from the real data (§7.4).
4. `analyzeDimensions(headers, realData)` → which columns are dimensions (§6.2).
5. `mergeValueSpaces` — adds values that exist only in anchor rows.
6. `validateAnchors`, then keeps or regenerates `dummyRows`.
7. Numbers the rows (`_index`), deep-copies to `originalData`.
8. **Resets all view and history state** — filters, value order, custom colours, column visibility, undo, change log, compare slots. Comment tag presets are the one thing that survives a reload.
9. Dimension order = analysis order, all enabled, then `autoAssignEncodingsFromOrder()`.
10. Renders the sidebar lists and calls `updateVisualization()`.

### 5.2 Redraw: `updateVisualization()` (5515)

Called from about 40 places. It rebuilds everything from state each time; there is no partial update.

```
updateVisualization
 ├─ encodings = buildEncodings()                 dimensionEncodings + enabledDimensions → slot map
 ├─ updateDimensionListEncodings()               sidebar: dropdowns, "3 of 5 values"
 ├─ renderValueFilters(encodings)                sidebar: checkbox + drag row per value
 ├─ updateColorLegend / updateShapeLegend        sidebar: editable legends
 ├─ updateEncodingLegendBar                      bar above grid (if switched on)
 ├─ updateGridInfo                               sidebar: "3 × 2" summary
 ├─ renderVisualization(currentData, encodings)  the grid itself
 │    ├─ creategrid(...) per grid X × grid Y
 │    │    └─ createpanelCell(...) per panel X × panel Y
 │    │         └─ createDataPoint(row) per row
 │    ├─ applyLabelStyle()
 │    └─ applyAdaptiveDotSizing()
 └─ updateFloatingLegend                         legend shown when sidebar is collapsed
```

A few toggles skip the full redraw and change the DOM directly: `toggleItemCounts`, `toggleDimensionNames`, `applyLabelStyle`, `toggleEncodingLegend`, and selection highlighting (`syncPointSelectionClasses`).

## 6. From columns to dots

### 6.1 Column roles

A column's role is stored **in its header**, as a prefix (3099):

| Prefix | Role | Effect |
|---|---|---|
| `dim::` | Dimension | Always offered as a dimension |
| `desc::` | Description | Never a dimension; shown in the record window only |
| `med::` | Media | Treated as a media link |
| `res::` | Reserved metadata | Never a dimension; hidden from the tooltip |
| *(none)* | Auto | Guessed, see §6.2 |

Changing a role in the interface (`setColumnRole`, 5274) **renames the column** in every row of `currentData`, `originalData` and `dummyRows`, and in every piece of state keyed by header (`renameColumnKey`, 5180), then re-runs the analysis (`rebuildDimensionsAfterColumnRoleChange`, 5225). The new header is what gets exported. This is the only place where a view decision changes the data file's shape.

### 6.2 Which columns become dimensions: `analyzeDimensions()` (5119)

A column with no prefix is a dimension unless any of these is true:

- its name **contains** `description`, `title` or `name` (`RESERVED_COLUMNS`) — so `filename`, `surname` and `subtitle_lang` are excluded too *(verified)*;
- it looks like media (`isMediaRelatedColumn`: names such as `audio_url`, `image`, `video_file`, `media_type`);
- its name is exactly one of `gloss`, `glossing`, `transcription`, `transcript`, `translation`, `meaning`, `orthography`, `description`, `text`, `sentence` (`DESC_LIKE_COLUMNS`);
- it is the first column and its name contains `id`;
- **every row has a different value** (treated as an identifier).

There is no upper limit on the number of values. All values are strings; a numeric column is a dimension whose values happen to be numerals.

Dimensions are then sorted by number of values, largest first, and that order decides the default layout.

### 6.3 Assigning dimensions to slots

Slot order is fixed (`ENCODING_LABELS`, 3031): **grid X, grid Y, colour, panel X, panel Y, shape**.

- `autoAssignEncodingsFromOrder()` (3054) walks the dimension list top to bottom and gives each enabled dimension the next free slot. A seventh dimension gets nothing.
- It runs at load, on **Reset**, after a column role change, and **every time the dimension list is reordered by dragging** — which discards any manual dropdown choices *(verified)*.
- `setDimensionEncoding()` (3077) handles the dropdown: one dimension per slot, so taking a slot empties it for whoever had it.
- `buildEncodings()` (3066) turns that into the `encodings` object, skipping dimensions that are unticked.

Unticking a dimension and choosing "—" in its dropdown have the same visible effect.

### 6.4 Which values, in what order

- `getOrderedDimensionValues(dim)` (3204): the user's order if one exists, otherwise alphabetical, case-insensitive. New values are appended.
- `getVisibleValues(dim)` (3214): the above, minus anything unticked in the filter. With no dimension it returns `['']`, which is how an unassigned slot becomes a single row or column.

Value order feeds axes, filter lists, legends, clustering, **and default colours and shapes**: a value's colour is its position in the order, modulo 10 colours; its shape is its position modulo 4 shapes (`getColorForValue`, `getShapeForValue`, 5096–5110). Reordering values therefore recolours them unless a custom colour is set.

### 6.5 Which rows are drawn

A row is drawn when all of these hold:

| Test | Where | Hides |
|---|---|---|
| Its grid X and grid Y values are visible | `renderVisualization` only builds visible rows/columns | The whole panel |
| Its panel X and panel Y values are visible | `createpanelCell` | The cell |
| Its colour and shape values are visible | `rowPassesColorShapeFilters` (3522) | The dot |
| It passes the comment filter | `rowPassesCommentFilter` (3333), called from the same function | The dot |

The same test applies however many values are visible, including one. (Until the fix for finding A1, a panel dimension with exactly one visible value skipped its test, and the one remaining cell showed rows of every value.)

**Saying how many are hidden** (finding A3, fixed). Both counts are taken from the dots actually drawn, after drawing, and neither ever includes anchors:

- The header line reads "8 records • 0 modified" when every record is drawn, and "4 of 8 records shown (filtered by Tone) • 0 modified" when not. `renderVisualization` writes it as its last step. `getHidingFilterNames` (6561) supplies the names in brackets: each placed dimension whose filter hides at least one record, in the order grid X, grid Y, panel X, panel Y, colour, shape, then "comments" if the comment filter hides at least one. A filter that hides nothing is not named. When no dimension is placed at all, nothing is drawn and `updateVisualization` (5515) writes "0 of 8 records shown" beside the "No dimensions assigned" message.
- A panel's count (**Show item counts**) reads "3 items" when every record belonging to the panel is drawn and "2 of 3 items" when not, whichever filter hid them. `creategrid` writes it after the panel's cells are filled. Anchors drawn in the panel follow as "(+1⚓)". Records hidden together with their whole panel (a grid X or grid Y filter) appear only in the header's number.

### 6.6 Drawing

- `renderVisualization` (6411) builds the outer CSS grid, the draggable axis headers, the axis titles, calls `creategrid` for each outer cell and, last, writes the header line from the number of dots drawn (§6.5).
- `creategrid` (6652) builds the inner grid and its headers, then the item count from the dots drawn in it (§6.5). Panel Y is drawn **bottom-to-top** (`.reverse()` at 6722) so it reads like a graph axis; grid Y is drawn top-to-bottom.
- `createpanelCell` (6781) filters rows, optionally sorts them by colour then shape (**Cluster by color**), and registers the cell as a drop target carrying its four coordinate values.
- `createDataPoint` (6998) builds one dot and attaches: drag, hover tooltip, click (record window), right-click (context menu). It adds classes `modified`, `has-comment`, `selected`, `compare-b`.
- `applyAdaptiveDotSizing` (6932) picks **one** dot size for the whole chart (12px down to 6px), enough for the most crowded cell. Size is deliberately never per-cell, because size is not an encoding. Under **Unify inner panel**, cells that still overflow switch to an overlapping stacked layout and, past 65% overlap, show a `+N` badge.

## 7. Changing the data

### 7.1 The four edits

| Action | Function | Fields changed |
|---|---|---|
| Drag a dot to another cell | `handleCellDrop` (5754) | Up to four at once: grid X, grid Y, panel X, panel Y |
| Right-click → pick a colour value | `changeColor` (5902) | The colour dimension's field |
| Right-click → pick a shape value | `changeShape` (5926) | The shape dimension's field |
| Type in the record window's comment box | `saveRecordCommentFromValues` (3285) | `desc::comment`, autosaved 350 ms after typing stops |

Each one follows the same sequence: write to `currentData`, add to `modifiedRows`, `pushUndoAction`, append to `changeLog`, `updateChangesIndicator`, `updateVisualization`.

The right-click menu changes the **row's value**. Clicking a swatch in the sidebar legend changes the **colour or shape used for a value** and does not touch the data. Both are described as "change color" in the interface.

### 7.2 Undo, redo, reset

- `undo` / `redo` (4987, 5042) replay the `changes` list of an action and move it between stacks. A drag that changed three fields is one undo step.
- `undo` re-checks the row against `originalData` to decide whether it still counts as modified.
- Both append to `changeLog`, so the log is a full audit trail, including reversals.
- `resetAllChanges` (4956) restores `originalData` and clears the stacks **and the log**.
- Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z are bound at document level (4064), including while typing in a text box.

### 7.3 What is not undoable

Changes to the view (filters, order, colours, roles, toggles) are not on the undo stack. Changing a column role also rewrites `originalData`, so it cannot be reset.

### 7.4 Anchor rows

**Purpose:** if you drag every row out of a category, that value would vanish from the axis and from the exported file. Anchor rows keep every value of every dimension alive.

- `generateDummyRows` (4782) creates as many rows as the largest dimension has values, cycling each dimension's values, with IDs `a`, `b`, `c`… in the first column.
- They are appended to the end of every exported CSV.
- **How an anchor is marked.** Each anchor carries a reserved ID: `__anchor__a`, `__anchor__b` … `__anchor__z`, `__anchor__aa` … (`getAnchorId`; the letters come from `getAlphaLabel`, which moves to two and then three letters by itself, so there is no upper limit). `getAnchorMarkerColumn` chooses where the ID is written: the first column, unless the first column is itself a dimension, in which case the first column that is not a dimension is used (the comment column only as a last resort).
- **How anchors are recognised on load.** `detectExistingDummies` treats a row as an anchor if **any** of its cells holds a reserved ID (`isAnchorRow`), wherever the row sits in the file. Nothing else about a row makes it an anchor. A real row must therefore never contain a cell that is exactly a reserved ID.
- After a column role change, `rebuildDimensionsAfterColumnRoleChange` first calls `ensureCommentColumn`, so that there is always at least one non-dimension column for the ID.
- **Files from before the reserved IDs.** Earlier versions wrote bare letters (`a`, `b`, `c` …). `countLegacyAnchorRows` still accepts those, but only when all of these hold: the last rows' first-column values are exactly `a`, `b`, `c` … in order starting at `a`; at least one other row comes before them; the first column is not itself a dimension; and those rows hold nothing an anchor could not hold. That last test means: outside the first column, a cell must be empty unless its column is a dimension, or would be one but for every earlier row having a different value in it and the cell repeats one of those earlier values. One ambiguity remains by design: real rows at the very end of a file whose IDs are exactly `a`, `b`, `c` … and which have values only in dimension columns cannot be told from old anchors, and are read as anchors (as they were before the fix). Rows accepted this way are given reserved IDs, so the next download is in the current format. (Until the fix for finding A2, *any* trailing rows whose first cell was only lowercase letters were taken for anchors.)
- `validateAnchors` (4811) checks count and coverage; if they do not match the current dimensions they are regenerated.
- They are hidden by default and never counted in "N records"; the **Anchor Points** sidebar section controls their appearance.

## 8. Looking at one row

| Surface | Function | Shows |
|---|---|---|
| Tooltip | `showTooltip` (7096) | First five fields that pass `shouldExcludeFromTooltip`, the comment, a modified flag, a hint line |
| Record window | `renderCompareModal` (7251) | Field table, media, comment editor (single record only) |
| Compare | same function, when slots A and B are both set | Three-column table with differing rows highlighted, media side by side |

- Click sets slot A, Shift+click sets slot B (`handleDataPointClick`, 7285).
- Fields shown and their order come from `columnRecordOrder` and `columnVisibility`, edited in the **Column roles** list.
- Tooltip and record window use **different exclusion rules** (`shouldExcludeFromTooltip` 3819 matches reserved names by substring; `shouldExcludeFromModalTable` 3828 by exact match).

### Media

- `detectMediaColumns` (4441) finds columns by `med::` prefix or by name pattern; type comes from the name (`audio`, `image`, `video`…) or, failing that, from the file extension.
- `resolveMediaUrl` (4486), in priority order: absolute / blob / data URL as is → file picked locally (`localMediaMap`, by path then by bare file name) → root-relative as is → relative to where the CSV came from.
- `generateMediaHTML` (7370): YouTube links become an embedded player; otherwise `<img>`, `<video>` or `<audio>`.
- A legacy pair of columns `media_type` + `media_url` is also honoured (4527).

## 9. Getting things out

| Output | Function | File name | Contains |
|---|---|---|---|
| Edited data | `generateCSV` / `downloadCSV` (4187, 4403) | `edited_data.csv` | All rows, all columns (in `Object.keys` order of the first row), then anchor rows. Always CSV, even if the input was JSON |
| Change log | `downloadChangeLog` (4601) | `change_log.csv` / `.json` | Every edit, undo and redo with timestamp |
| Setup | `buildVisualizationConfig` (3569) | `plew-setup-<dataset>.json` | See below |
| Grid image | `downloadSnapshot` (4360) | `grid_snapshot.png` | The grid, with a legend added on top; dark or light; comment rings removed |
| Record image | `snapshotModal` (7682) | `<title>_stacked.png` / `_side-by-side.png` | The record window |
| Report | `generateReport` (7603) | `report.html` | Counts, percentages, crosstabs |

### The setup file (version 5)

```
version, kind: "plew-visualization-config", exportedAt
dataset      { id, label }
dimensions   { order[], enabled[], encodings{name: slot} }
valueFilters { key: [visible values] }
valueOrder   { key: [ordered values] }
styling      { customColors{value: hex}, customShapes{value: shape} }
display      { showItemCounts, showDimensionNames, clusterPoints, uniformGridSizes,
               outerPanelRowHeight, unifyInnerPanel, innerPanelRowHeight,
               labelSize, labelColor, countSize, countColor }
dummySettings{ visible, color, opacity, shape }
columns      { visibility{header: bool}, recordOrder[] }
comments     { showCommentsOnly, presetLabels[], visibleTags[] }
```

`applyConfigState` (3626) is forgiving: unknown dimensions and values are dropped silently, missing ones are appended, and a mismatch in dataset name asks for confirmation. Not stored: **Show color & shape**, the record-snapshot theme, and column roles (those live in the headers).

Because filters, value order and column settings are keyed by header, and a role change renames the header, a setup saved after changing roles only fully applies to a CSV exported from the same session.

### The report

Works on `currentData` in full: it ignores filters and the current layout, and excludes anchors. Percentages are of all rows. It is the only place in PLeW where rows are summarised rather than shown.

### Snapshots and the network

Grid snapshots use html2canvas on a temporary wrapper (`prepareSnapshotCaptureRoot`), with `fixSnapshotLabels` un-rotating vertical labels and expanding overflowing cells in the clone.

Record snapshots need images as data URLs. They are fetched **only when a snapshot button in the record window is pressed** (`snapshotModal` → `inlineImagesForSnapshot` → `imageSrcToDataUrl`), and images from another origin are fetched through the third-party proxy `wsrv.nl` (`getSnapshotFetchUrl`, 7393). Each address is fetched once: results are kept in `snapshotImageCache`, and fetches in progress in `snapshotImagePending`. The two buttons' tooltips say that the proxy is used. (Until the fix for finding A9, `preloadModalImages` started these fetches whenever a record window opened.)

## 10. The interface, control by control

### Sidebar (top to bottom)

| Section | Shown when | Controls → function → state |
|---|---|---|
| Title and links | always | Links to the example gallery, plew-map, and the three help pages (User guide · Design guide · Code map), which open in a new tab. No JavaScript involved |
| Data Input | always (editor only) | Drop zone / file picker → `loadFile`, `handleMixedFiles`; **Load media files…** → `loadMediaFolder` → `localMediaMap` |
| Changes | after first edit | Undo, Redo, **Download CSV**, **Reset All** |
| Change Log | data loaded | CSV, JSON, Clear; last 20 entries |
| Column roles | data loaded | Per column: drag (record field order), 👁 (record field visibility), role dropdown |
| Dimensions | data loaded | Per dimension: drag (order → re-assigns slots), tick (`enabledDimensions`), slot dropdown; **Reset**; grid size summary |
| Visualization setup | data loaded | Export setup, Import setup |
| Filter values | any slot assigned | Per assigned dimension: All / None, tick per value (`dimensionValueFilters`), drag per value (`dimensionValueOrder`) |
| Comments | data loaded | Tag list textarea → `commentPresetLabels` |
| Color legend | colour assigned | Swatch → colour picker → `customColorMap` |
| Shape legend | shape assigned | Shape → popup → `customShapeMap` |
| Anchor Points | anchors exist | Show, colour, opacity, shape → `dummySettings` |

### Header bar (above the grid)

Column roles ▾ (a second copy of the sidebar list) · Label styling ▾ (4 controls → CSS variables) · Unify grid sizes + height · Unify inner panel + height · Show item counts · Show dimension names · Download CSV · 📷 Dark · 📷 Light · Report.

### Toolbar (below the header)

Show only rows with comments · Tags to show (appears when tags exist and the filter is on) · Show color & shape (legend bar whose chips also toggle value filters) · Cluster by color.

### In the grid

| Gesture | On | Effect |
|---|---|---|
| Hover | dot | Tooltip |
| Click | dot | Record window, slot A |
| Shift+click | dot | Slot B → comparison |
| Drag | dot → cell | Reclassify |
| Right-click | dot | Change the row's colour / shape value |
| Drag | axis header ⋮ | Reorder that dimension's values |
| Click | empty grid space | Clear selection |

### Floating (only when the sidebar is collapsed)

Load CSV · Download · Dark Snap · Light Snap · Report, and a read-only legend.

### Keyboard

`B` sidebar · `Esc` close menus and windows · `Ctrl/Cmd+Z` undo · `Ctrl/Cmd+Shift+Z` redo.

### CSS variables set from controls

`--label-font-size`, `--label-color`, `--count-font-size`, `--count-color`, `--panel-label-font-size`, `--panel-label-color` (set by `applyLabelStyle`), and `--dot-size` (set by `applyAdaptiveDotSizing`).

## 11. What depends on what

Read each line as "changing the left side redraws or invalidates the right side".

```
column header prefix ─► role ─► analyzeDimensions ─► allDimensions ─┬─► dimension list
                         │                                          ├─► anchors (regenerated if stale)
                         └─► mediaColumns ─► record window media    └─► slot assignment (auto)

dimension list order ─► autoAssign ─► dimensionEncodings ─► encodings ─┬─► grid shape
tick / dropdown ───────────────────────►        "                      ├─► filter section contents
                                                                       ├─► legends (×4)
                                                                       └─► what a drag or right-click edits

dimensionValueOrder ─┬─► axis order
                     ├─► filter list order, legend order
                     ├─► default colour and shape of each value
                     └─► cluster sort order

dimensionValueFilters ─► visible rows / columns / dots ─► item counts
                         (not: record total, report)

row edit ─► currentData ─► modifiedRows ─► "modified" ring, counts
        ├─► undoStack
        └─► changeLog

desc::comment ─► has-comment ring ─► comment filter ─► visible dots
comment tags ──► quick-insert buttons, "Tags to show"
```

### Cross-feature couplings worth knowing

- **Encodings define what editing means.** A drag only changes the fields currently on grid X/Y and panel X/Y; a right-click only offers the fields on colour and shape. Reassigning slots changes which columns the same gesture writes to.
- **Comments are both data and filter.** The comment filter is applied inside the colour/shape filter function, so it applies even when no colour or shape is assigned.
- **Column roles reach everywhere.** One role change touches rows, original data, anchors, headers, change log, undo stacks, filters, value order, visibility and record order.
- **Value order is also the palette.** See §6.4.
- **Row IDs assume the first column is an identifier.** The change log labels each row by its first-column value (`getRowDisplayId`). Anchors no longer depend on the first column: they are recognised by their reserved ID in any column (§7.4). Only the reading of old-format files still looks at the first column.
- **Legends are four renderings of one thing.** Sidebar colour legend, sidebar shape legend, legend bar, floating legend — plus a fifth built for snapshots — all derive from `encodings.color` / `encodings.shape` through the same two lookup functions.

## 12. The two files

`example-viz.html` is `index.html` with these differences:

| | `index.html` (editor) | `example-viz.html` (example page) |
|---|---|---|
| Data source | Drop zone, file picker, local media (172 lines of FILE HANDLING) | `fetch(DATASET_URL)` from front matter; no upload |
| Setup | Manual import | Also auto-loads `config_url` (`loadPreCalibratedConfig`) |
| Media paths | `resolveMediaUrl` (local map, CSV base URL) | `resolveExampleUrl` (always relative to site base) |
| Title and subtitle | Fixed | From the page's `title` and `description` |
| Audio element | Fixed `wav` + `mpeg` sources | MIME type chosen from extension, `preload="metadata"` |
| `.ogg` | Counted as video | Counted as audio |
| Inner axis label style | Hard-coded | Follows the label-styling variables |
| Label styling wording | "Count size / Count color" | "Inner panel size / Inner panel color" |
| Anchor opacity default in markup | 0.05 | 0.3 |
| "Inner Grid:" summary label | "Inner Grid:" | "panel Grid:" |

Everything else — about 7,500 lines — is duplicated and must be changed in both files by hand.

## 13. Other files in the repository

| Path | What it is | Live? |
|---|---|---|
| `layouts/examples/list.html` | Example gallery page | Yes |
| `layouts/_default/doc.html` | Page frame for the help pages (top bar, contents list, text) | Yes |
| `content/guide.md`, `content/design.md`, `content/code-map.md` | The three help pages. Each holds only a title and one line that pulls in a file from `docs/` | Yes |
| `layouts/shortcodes/doc.html` | The `doc` shortcode those pages use to pull in a `docs/` file | Yes |
| `layouts/_default/_markup/render-link.html` | Rewrites links inside `docs/` files when shown as site pages: to the matching help page, or to the file on GitHub | Yes |
| `docs/` | The documents themselves, the test CSVs, and the verification stamp | Yes |
| `tools/code-userguide-review.md` | Procedure for checking the documents against the code, and the tool's stability after a change | Yes |
| `tools/checks/` | Scripts used by that procedure: `behaviour.js` and `anchors.js` (before/after records to diff), `links.js` (link check), `remap-line-numbers.py` and `check-line-refs.py` (line references in these documents) | Yes |
| `docs/HANDOFF.md` | State of the streamlining work and the process each fix follows | Yes |
| `content/examples/*.md` | One page per example: `title`, `description`, `dataset_url`, optional `config_url` | Yes (16 published) |
| `static/data/*.csv`, `static/<name>/` | Example data and media | Yes |
| `tools/prefix_media_paths.py` | Adds folder prefixes to media paths in a CSV | Yes, documented in README |
| `tools/simple/`, `tools/heartbeat/` | Launch scripts plus two **identical** copies of an older 4,463-line visualizer | Older lineage |
| `layouts/backup-index.html` | Older editor, 4,565 lines | Not referenced |
| `layouts/shortcodes/visualizer-test.html` | Older shortcode version, 2,936 lines | Not referenced by any content |
| `layouts/_default/full-visualizer.txt` | Older copy as text, 2,913 lines | Not referenced |
| `_archive/` | Earlier editors and plew-map | Archive |
| `content/examples/.old_ex/` | Retired example pages | Hidden |
| `CHANGELOG-fs-edits.md` | History of the prefix work | Reference |
| `.github/workflows/hugo.yml` | Builds with Hugo 0.128.0 and deploys to GitHub Pages on push to `main` | Yes |
