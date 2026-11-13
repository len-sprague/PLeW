# PLeW code map

How the pieces of PLeW relate to each other in the code.

- **Subject:** `layouts/index.html` (the full editor, 7,952 lines) and its near-twin `layouts/_default/example-viz.html` (the example pages, 7,743 lines).
- **Line numbers** refer to `layouts/index.html` at commit `01f1fd4`. They will drift; the section banners and `FEATURE:` markers named below are the stable way to find things.
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
| 2591–3015 | `<body>` markup | Static skeleton: sidebar, main area, tooltip, context menu, two modals. Most content is filled in by JavaScript. |
| 3017–7950 | `<script>` | One classic script, about 244 top-level functions, all global. No modules, no classes, no build step. |

Hugo is used only as a thin wrapper. `index.html` contains two template expressions (the examples link at 2598 and `SITE_BASE` at 3021); `example-viz.html` adds `.Title`, `.Description`, `dataset_url` and `config_url`. Remove those and the file runs from disk.

### Script section order

The script is laid out in banner-commented sections, with newer work wrapped in `// --- FEATURE: name (start/end) ---` markers.

| Lines | Section | Role |
|---|---|---|
| 3018–3116 | CONFIGURATION | Palettes, encoding slots, column-name conventions |
| 3118–3232 | value order + value filter helpers | Read/write `dimensionValueOrder`, `dimensionValueFilters` |
| 3245–3519 | row-comments | The `desc::comment` column, tag presets, comment filter, editor |
| 3559–3816 | viz-config-io | Export / import of the setup JSON |
| 3818–3934 | column visibility, record field order, modal title | |
| 3936–3951 | media detection patterns | |
| 3953–4022 | STATE | Every global variable |
| 4024–4072 | sidebar toggle, keyboard shortcuts | |
| 4074–4181 | CSV and JSON parsing | |
| 4183–4418 | CSV export, grid snapshot | |
| 4420–4539 | media column detection and URL resolution | |
| 4541–4640 | change log | |
| 4642–4829 | anchor ("dummy") rows | |
| 4831–4993 | change tracking, undo / redo | |
| 4995–5016 | colour and shape lookup | |
| 5018–5056 | dimension analysis | Which columns become dimensions |
| 5058–5366 | column-roles | Role editor, column rename, rebuild |
| 5375–5446 | `updateVisualization()` | The single redraw entry point |
| 5448–5693 | drag and drop: dimensions, values, data points | |
| 5695–5862 | right-click context menu | |
| 5864–6296 | sidebar and legend rendering | |
| 6298–6679 | grid rendering | `renderVisualization` → `creategrid` → `createpanelCell` |
| 6681–6850 | adaptive dot sizing | |
| 6852–7001 | data point, tooltip | |
| 7003–7240 | record modal, compare, media HTML | |
| 7242–7345 | image inlining for modal snapshots | |
| 7347–7530 | report | |
| 7532–7641 | modal snapshot, modal close | |
| 7643–7813 | FILE HANDLING | Drop zone, file inputs, local media map |
| 7815–7939 | `processParsedRows()` | The single load entry point |

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
2. **A dimension has a `name` and a `key`.** `key` is the real column header (`dim::Function`); `name` is the header with any prefix removed (`Function`). `dimKey(dim)` (3114) returns the key. Row lookups, filters and value order use the **key**. Dimension order, the enabled set and encoding assignment use the **name**.

## 4. State

All state is in global `let` variables declared at 3956–4022, plus a few declared beside their feature. There is no state object and no change notification; functions mutate these directly and then call `updateVisualization()`.

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

### 5.1 Load: `processParsedRows()` (7834)

```
drop / file picker ──► loadFile ──► processDataFile ──┬─► parseCSV ──┐
example page fetch(DATASET_URL) ──────────────────────┴─► parseJSON ─┴─► processParsedRows
```

In order, it:

1. Adds the `desc::comment` column if missing.
2. `detectMediaColumns(headers)` → `mediaColumns`.
3. `detectExistingDummies` — splits trailing anchor rows off the real data (§7.4).
4. `analyzeDimensions(headers, realData)` → which columns are dimensions (§6.2).
5. `mergeValueSpaces` — adds values that exist only in anchor rows.
6. `validateAnchors`, then keeps or regenerates `dummyRows`.
7. Numbers the rows (`_index`), deep-copies to `originalData`.
8. **Resets all view and history state** — filters, value order, custom colours, column visibility, undo, change log, compare slots. Comment tag presets are the one thing that survives a reload.
9. Dimension order = analysis order, all enabled, then `autoAssignEncodingsFromOrder()`.
10. Renders the sidebar lists and calls `updateVisualization()`.

### 5.2 Redraw: `updateVisualization()` (5412)

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

A column's role is stored **in its header**, as a prefix (3098):

| Prefix | Role | Effect |
|---|---|---|
| `dim::` | Dimension | Always offered as a dimension |
| `desc::` | Description | Never a dimension; shown in the record window only |
| `med::` | Media | Treated as a media link |
| `res::` | Reserved metadata | Never a dimension; hidden from the tooltip |
| *(none)* | Auto | Guessed, see §6.2 |

Changing a role in the interface (`setColumnRole`, 5171) **renames the column** in every row of `currentData`, `originalData` and `dummyRows`, and in every piece of state keyed by header (`renameColumnKey`, 5082), then re-runs the analysis (`rebuildDimensionsAfterColumnRoleChange`, 5127). The new header is what gets exported. This is the only place where a view decision changes the data file's shape.

### 6.2 Which columns become dimensions: `analyzeDimensions()` (5021)

A column with no prefix is a dimension unless any of these is true:

- its name **contains** `description`, `title` or `name` (`RESERVED_COLUMNS`) — so `filename`, `surname` and `subtitle_lang` are excluded too *(verified)*;
- it looks like media (`isMediaRelatedColumn`: names such as `audio_url`, `image`, `video_file`, `media_type`);
- its name is exactly one of `gloss`, `glossing`, `transcription`, `transcript`, `translation`, `meaning`, `orthography`, `description`, `text`, `sentence` (`DESC_LIKE_COLUMNS`);
- it is the first column and its name contains `id`;
- **every row has a different value** (treated as an identifier).

There is no upper limit on the number of values. All values are strings; a numeric column is a dimension whose values happen to be numerals.

Dimensions are then sorted by number of values, largest first, and that order decides the default layout.

### 6.3 Assigning dimensions to slots

Slot order is fixed (`ENCODING_LABELS`, 3030): **grid X, grid Y, colour, panel X, panel Y, shape**.

- `autoAssignEncodingsFromOrder()` (3053) walks the dimension list top to bottom and gives each enabled dimension the next free slot. A seventh dimension gets nothing.
- It runs at load, on **Reset**, after a column role change, and **every time the dimension list is reordered by dragging** — which discards any manual dropdown choices *(verified)*.
- `setDimensionEncoding()` (3076) handles the dropdown: one dimension per slot, so taking a slot empties it for whoever had it.
- `buildEncodings()` (3065) turns that into the `encodings` object, skipping dimensions that are unticked.

Unticking a dimension and choosing "—" in its dropdown have the same visible effect.

### 6.4 Which values, in what order

- `getOrderedDimensionValues(dim)` (3203): the user's order if one exists, otherwise alphabetical, case-insensitive. New values are appended.
- `getVisibleValues(dim)` (3213): the above, minus anything unticked in the filter. With no dimension it returns `['']`, which is how an unassigned slot becomes a single row or column.

Value order feeds axes, filter lists, legends, clustering, **and default colours and shapes**: a value's colour is its position in the order, modulo 10 colours; its shape is its position modulo 4 shapes (`getColorForValue`, `getShapeForValue`, 4998–5012). Reordering values therefore recolours them unless a custom colour is set.

### 6.5 Which rows are drawn

A row is drawn when all of these hold:

| Test | Where | Hides |
|---|---|---|
| Its grid X and grid Y values are visible | `renderVisualization` only builds visible rows/columns | The whole panel |
| Its panel X and panel Y values are visible | `createpanelCell` | The cell |
| Its colour and shape values are visible | `rowPassesColorShapeFilters` (3521) | The dot |
| It passes the comment filter | `rowPassesCommentFilter` (3332), called from the same function | The dot |

One exception: when a panel dimension has exactly **one** visible value, `createpanelCell` skips the test for that dimension (the `length > 1` conditions at 6641 and 6644), so the single remaining cell shows rows of **every** value *(verified: filtering a 3-value panel dimension down to 2 shows 4 of 6 rows; down to 1 shows all 6 again)*.

The header line "N records • M modified" always reports the total, not the number currently drawn.

### 6.6 Drawing

- `renderVisualization` (6301) builds the outer CSS grid, the draggable axis headers, the axis titles, and calls `creategrid` for each outer cell.
- `creategrid` (6512) builds the item count, the inner grid and its headers. Panel Y is drawn **bottom-to-top** (`.reverse()` at 6586) so it reads like a graph axis; grid Y is drawn top-to-bottom.
- `createpanelCell` (6635) filters rows, optionally sorts them by colour then shape (**Cluster by color**), and registers the cell as a drop target carrying its four coordinate values.
- `createDataPoint` (6852) builds one dot and attaches: drag, hover tooltip, click (record window), right-click (context menu). It adds classes `modified`, `has-comment`, `selected`, `compare-b`.
- `applyAdaptiveDotSizing` (6786) picks **one** dot size for the whole chart (12px down to 6px), enough for the most crowded cell. Size is deliberately never per-cell, because size is not an encoding. Under **Unify inner panel**, cells that still overflow switch to an overlapping stacked layout and, past 65% overlap, show a `+N` badge.

## 7. Changing the data

### 7.1 The four edits

| Action | Function | Fields changed |
|---|---|---|
| Drag a dot to another cell | `handleCellDrop` (5644) | Up to four at once: grid X, grid Y, panel X, panel Y |
| Right-click → pick a colour value | `changeColor` (5792) | The colour dimension's field |
| Right-click → pick a shape value | `changeShape` (5816) | The shape dimension's field |
| Type in the record window's comment box | `saveRecordCommentFromValues` (3284) | `desc::comment`, autosaved 350 ms after typing stops |

Each one follows the same sequence: write to `currentData`, add to `modifiedRows`, `pushUndoAction`, append to `changeLog`, `updateChangesIndicator`, `updateVisualization`.

The right-click menu changes the **row's value**. Clicking a swatch in the sidebar legend changes the **colour or shape used for a value** and does not touch the data. Both are described as "change color" in the interface.

### 7.2 Undo, redo, reset

- `undo` / `redo` (4889, 4944) replay the `changes` list of an action and move it between stacks. A drag that changed three fields is one undo step.
- `undo` re-checks the row against `originalData` to decide whether it still counts as modified.
- Both append to `changeLog`, so the log is a full audit trail, including reversals.
- `resetAllChanges` (4858) restores `originalData` and clears the stacks **and the log**.
- Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z are bound at document level (4063), including while typing in a text box.

### 7.3 What is not undoable

Changes to the view (filters, order, colours, roles, toggles) are not on the undo stack. Changing a column role also rewrites `originalData`, so it cannot be reset.

### 7.4 Anchor rows

**Purpose:** if you drag every row out of a category, that value would vanish from the axis and from the exported file. Anchor rows keep every value of every dimension alive.

- `generateDummyRows` (4684) creates as many rows as the largest dimension has values, cycling each dimension's values, with IDs `a`, `b`, `c`… in the first column.
- They are appended to the end of every exported CSV.
- On load, `detectExistingDummies` (4659) treats **trailing rows whose first-column value is only lowercase letters** as anchors. A file whose first column is lowercase words is therefore read as all anchors and no data *(verified)*.
- `validateAnchors` (4713) checks count and coverage; if they do not match the current dimensions they are regenerated.
- They are hidden by default and never counted in "N records"; the **Anchor Points** sidebar section controls their appearance.

## 8. Looking at one row

| Surface | Function | Shows |
|---|---|---|
| Tooltip | `showTooltip` (6950) | First five fields that pass `shouldExcludeFromTooltip`, the comment, a modified flag, a hint line |
| Record window | `renderCompareModal` (7105) | Field table, media, comment editor (single record only) |
| Compare | same function, when slots A and B are both set | Three-column table with differing rows highlighted, media side by side |

- Click sets slot A, Shift+click sets slot B (`handleDataPointClick`, 7140).
- Fields shown and their order come from `columnRecordOrder` and `columnVisibility`, edited in the **Column roles** list.
- Tooltip and record window use **different exclusion rules** (`shouldExcludeFromTooltip` 3818 matches reserved names by substring; `shouldExcludeFromModalTable` 3827 by exact match).

### Media

- `detectMediaColumns` (4440) finds columns by `med::` prefix or by name pattern; type comes from the name (`audio`, `image`, `video`…) or, failing that, from the file extension.
- `resolveMediaUrl` (4485), in priority order: absolute / blob / data URL as is → file picked locally (`localMediaMap`, by path then by bare file name) → root-relative as is → relative to where the CSV came from.
- `generateMediaHTML` (7225): YouTube links become an embedded player; otherwise `<img>`, `<video>` or `<audio>`.
- A legacy pair of columns `media_type` + `media_url` is also honoured (4526).

## 9. Getting things out

| Output | Function | File name | Contains |
|---|---|---|---|
| Edited data | `generateCSV` / `downloadCSV` (4186, 4402) | `edited_data.csv` | All rows, all columns (in `Object.keys` order of the first row), then anchor rows. Always CSV, even if the input was JSON |
| Change log | `downloadChangeLog` (4600) | `change_log.csv` / `.json` | Every edit, undo and redo with timestamp |
| Setup | `buildVisualizationConfig` (3568) | `plew-setup-<dataset>.json` | See below |
| Grid image | `downloadSnapshot` (4359) | `grid_snapshot.png` | The grid, with a legend added on top; dark or light; comment rings removed |
| Record image | `snapshotModal` (7532) | `<title>_stacked.png` / `_side-by-side.png` | The record window |
| Report | `generateReport` (7453) | `report.html` | Counts, percentages, crosstabs |

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

`applyConfigState` (3625) is forgiving: unknown dimensions and values are dropped silently, missing ones are appended, and a mismatch in dataset name asks for confirmation. Not stored: **Show color & shape**, the record-snapshot theme, and column roles (those live in the headers).

Because filters, value order and column settings are keyed by header, and a role change renames the header, a setup saved after changing roles only fully applies to a CSV exported from the same session.

### The report

Works on `currentData` in full: it ignores filters and the current layout, and excludes anchors. Percentages are of all rows. It is the only place in PLeW where rows are summarised rather than shown.

### Snapshots and the network

Grid snapshots use html2canvas on a temporary wrapper (`prepareSnapshotCaptureRoot`), with `fixSnapshotLabels` un-rotating vertical labels and expanding overflowing cells in the clone.

Record snapshots need images as data URLs. `preloadModalImages` (7279) starts fetching them **whenever a record window opens**, and images from another origin are fetched through the third-party proxy `wsrv.nl` (`getSnapshotFetchUrl`, 7245).

## 10. The interface, control by control

### Sidebar (top to bottom)

| Section | Shown when | Controls → function → state |
|---|---|---|
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
- **Anchors depend on the first column.** Both row IDs in the change log (`getRowDisplayId`) and anchor detection assume the first column is an identifier.
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
