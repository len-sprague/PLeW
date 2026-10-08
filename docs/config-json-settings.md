# PLeW setup (config) JSON: what is and isn't saved

Both `layouts/index.html` (full editor) and `layouts/_default/example-viz.html`
(example pages) use the same code: `buildVisualizationConfig()` →
`downloadVisualizationConfig()` for export, and
`importVisualizationConfigFromFile()` → `applyVisualizationConfig()` →
`applyConfigState()` for import. Both live in the `viz-config-io` feature block.
`example-viz.html` additionally auto-loads a config at page load when the
example's front matter sets `config_url` (`loadPreCalibratedConfig()`).

File format: `{ kind: "plew-visualization-config", version, ... }`. Import
rejects files whose `kind` differs, ignores unknown dimension/column names, and
leaves a setting alone when its key is absent, so older files still load.

## Saved (before this change, version 2)

| Key | Setting |
|---|---|
| `dataset.id` / `label` | Dataset filename (used only for a "different dataset" warning) |
| `dimensions.order` | Dimension order in the sidebar |
| `dimensions.enabled` | Which dimensions are enabled |
| `dimensions.encodings` | Dimension → grid X / grid Y / color / panel X / panel Y / shape |
| `valueFilters` | Visible values per dimension |
| `styling.customColors` / `customShapes` | Per-value color and shape overrides |
| `display.showItemCounts` | Show item counts |
| `display.showDimensionNames` | Show dimension names |
| `display.clusterPoints` | Cluster by color |
| `display.uniformGridSizes` + `outerPanelRowHeight` | Unify grid sizes + height (px) |
| `display.unifyInnerPanel` + `innerPanelRowHeight` | Unify inner panel + height (px) |
| `display.labelSize` / `labelColor` / `countSize` / `countColor` | Label styling |
| `dummySettings` | Anchor points: visible, color, opacity, shape |
| `columns.visibility` | Per-column record-window visibility (eye icon) |
| `columns.recordOrder` | Field order in the record window |

Note: the "unify panel sizing" options were already saved/restored.

## Added in version 3 (this change)

| Key | Setting |
|---|---|
| `display.showEncodingLegend` | "Show color & shape" toolbar toggle |
| `media.videoMuted` | Record-window videos start muted (default `true`, previously hard-coded) |
| `media.audioMuted` | Record-window audio starts muted (default `false`) |
| `media.loop` | Loop video/audio |
| `layout.sidebarCollapsed` | Sidebar collapsed on load |
| `layout.floatingLegendMinimized` | Floating legend minimized |

New sidebar controls (Visualization setup → Media playback): Mute video, Mute
audio, Loop. They also update players that are already open.

## Not saved, but could be

| Setting | Where it lives | Notes |
|---|---|---|
| Column roles (Auto / Dimension / Description / Media / Reserved) | `setColumnRole()` renames the data header with a `dim::`/`med::`/`desc::`/`res::` prefix | Not in config; only persists via CSV download. Could save `{displayName: role}` and re-apply with `setColumnRole()`. `columns.visibility`/`recordOrder` are keyed by the *prefixed* header, so a role change can orphan them. Needs care. |
| Media autoplay, default volume, playback rate | Not implemented in the app | Would extend `mediaSettings`. Autoplay is awkward: with several media tabs, hidden players would play too, and browsers block unmuted autoplay. |
| Snapshot theme (dark/light) | `modalSnapshotLight` | Easy: one boolean. |
| Report modal choices | `reportCrosstabs`, `#reportOverview`, per-dimension count/pct checkboxes | Easy; reset each time the report modal opens. |
| Dot sizing (`DOT_SIZE_DEFAULT`, floor, step, gap) | Constants | Could be made options. Currently auto-fit. |
| Label dropdown / Column-roles panel open state | DOM classes | UI-only; low value. |
| Selected record / compare slots (A/B) | `selectedRowIndex`, `compareSlots` | Row-index based, so fragile across datasets; could save by row ID. |
| Active media tab per record | DOM | Transient. |

## Intentionally outside the config

Edited data (`modifiedRows`, `changeLog`, undo/redo, `dummyRows`, renamed
columns) belongs in the exported CSV. Media files, `localMediaMap`, and
`csvBaseUrl` are runtime/loading state.

## Testing

`index.html` was exercised in headless Chromium (Hugo tags substituted by
hand, `static/data/zoo.csv`): flip every new control → export → reload →
import → re-export gives an identical config; a version-2 file without the
new keys still imports; `generateMediaHTML` emits `muted`/`loop` per setting.
`example-viz.html` got the identical patch, but couldn't be rendered here
because Hugo isn't installed in this environment.
