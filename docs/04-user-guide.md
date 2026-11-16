# PLeW user guide

How to use PLeW, for people who do not code and for people who do.

**Status: rough first draft**, written from the tool as it stands. It is also published as a help page beside the tool; the **Help** links under the tool's title open it. Known rough edges are noted where they affect what you see; the full list is in the [streamlining report](02-streamlining-report.md).

- [Part 1 — Using PLeW](#part-1--using-plew) (no coding)
- [Part 2 — Preparing and sharing data](#part-2--preparing-and-sharing-data) (a little file handling)
- [Part 3 — Working on PLeW itself](#part-3--working-on-plew-itself) (for coders)

---

## Part 1 — Using PLeW

### The idea in one minute

Your data is a table. Each **row** is one thing you observed: a recording, a sentence, a response. Each **column** says something about it.

PLeW draws **every row as one dot**. You choose which columns decide where the dots go and what they look like. Nothing is averaged or summarised: if you have 200 rows you see 200 dots, and you can click any of them to see — or hear — exactly what it is.

### Reading the picture

```
                 Grid X: Function
            Genuine            Echo
          ┌──────────────┬──────────────┐
  Grid Y  │  ● ● ■       │  ● ■ ■       │   each box = a panel
  Tone    │  ●           │  ● ●         │
  Rising  ├──────────────┼──────────────┤   colour = one column
          │  ■ ■         │  ●           │   shape  = another column
  Falling │  ● ● ●       │  ■ ■ ■ ●     │
          └──────────────┴──────────────┘
```

A column used this way is called a **dimension**. Up to six dimensions can be shown at once, each in one **placement**:

| Placement | What it does |
|---|---|
| **Grid X** | Splits the picture into columns of panels |
| **Grid Y** | Splits the picture into rows of panels |
| **Panel X** | Splits each panel into columns |
| **Panel Y** | Splits each panel into rows (read from the bottom up, like a graph) |
| **Color** | Colours each dot |
| **Shape** | Circle, square, diamond or triangle |

Each category within a dimension is a **value**.

### Loading data

- **Your own data:** on the main page, drop a CSV file onto the box at the top left, or click it to choose a file. You can drop media files (sound, images, video) together with it.
- **An example:** choose one from *View example datasets*. It opens with the data already loaded.

Your file is read by your browser. It is not uploaded anywhere.

PLeW then arranges things for you: the dimensions with the most values go to Grid X and Grid Y, the next to Color, and so on. This is only a starting point.

### Arranging the picture

Everything here is in the **Dimensions** section of the left sidebar.

| To do this | Do this |
|---|---|
| Put a dimension somewhere specific | Choose from the dropdown on its row |
| Take a dimension off the picture | Choose **—**, or untick it |
| Re-deal all placements in order | Drag rows up or down by the **⋮⋮** handle |
| Start again | **Reset** |

> **Good to know.** Dragging the list re-deals *all* placements from top to bottom, replacing anything you chose in the dropdowns. Arrange by dragging first, then fine-tune with dropdowns.

### Choosing which values to see, and in what order

In **Filter values**, each dimension on the picture lists its values.

- **Untick** a value to hide it. **All** / **None** set the whole list.
- **Drag** a value by **⋮⋮** to change the order. You can also drag the **⋮** on any axis heading in the picture itself.

A filtered dimension shows "3 of 5 values" in the Dimensions list.

When a filter hides records, the line above the picture says so: "150 of 200 records shown (filtered by Tone)". The names in brackets are the filters that are hiding something. Turn on **Show item counts** to see the same for each panel: "12 items" when all of a panel's records are drawn, "9 of 12 items" when some are hidden. Anchors are never part of these numbers.

### Looking at a single record

| Do this | To get this |
|---|---|
| **Hover** over a dot | A short summary |
| **Click** a dot | The full record: every field, plus any sound, image or video |
| **Shift+click** a second dot | A side-by-side comparison; fields that differ are highlighted |
| **Esc**, or click outside | Close |

**Column roles ▾** (above the picture) decides which fields the record window shows and in what order: drag to reorder, click 👁 to hide.

### Colours and shapes

- In the sidebar legends, **click a colour swatch** to pick a different colour for that value, or **click a shape** to pick a different shape.
- Tick **Show color & shape** above the picture for a legend bar. Clicking a chip there hides or shows that value.
- Tick **Cluster by color** to gather same-coloured dots together within each cell.

There are ten default colours and four shapes. With more values than that they start to repeat, so give the important ones their own colour.

### Changing the data

PLeW is also a workbench: you can re-categorise records by hand.

| Do this | What changes |
|---|---|
| **Drag a dot** to another cell | Its values for whatever is on Grid X, Grid Y, Panel X and Panel Y |
| **Right-click a dot** and pick | Its value for whatever is on Color or Shape |
| Type in the **comment** box of a record | A note, saved as you type |

Changed dots get a ring. Every change is:

- **undoable** — **Undo** / **Redo** in the sidebar, or Ctrl+Z / Ctrl+Shift+Z (⌘ on a Mac);
- **logged** — the **Change Log** lists each one with the time, and can be downloaded;
- **reversible in full** — **Reset All** returns to the data as loaded.

> **Two things that sound alike.** Clicking a swatch in the *legend* changes which colour stands for a value; your data is untouched. *Right-clicking a dot* moves that record to a different value; your data changes.

### Comments and tags

Open a record and type in the comment box. Dots with a comment get a purple ring.

To sort comments into kinds, list your own tags in the sidebar's **Comments** section, one per line, and press **Update tag buttons**. Each tag becomes a button in the record window that inserts `Tag:` into the note.

Above the picture, **Show only rows with comments** hides everything else, and **Tags to show** narrows it further.

### Anchors

If you drag every record out of a category, that category would disappear from the picture and from your saved file. To prevent this PLeW keeps a few invisible placeholder rows, called **anchors**, one set covering every value. They are added to the end of the CSV you download, where you can tell them by their ID: `__anchor__a`, `__anchor__b`, and so on (after `__anchor__z` comes `__anchor__aa`). The ID is normally in the first column. PLeW recognises anchors by that ID when you load the file again, so leave those rows and their IDs as they are if you edit the file elsewhere. You can make anchors visible in the **Anchor Points** section. They are never counted as records.

Files saved by earlier versions of PLeW, where anchors were marked with a bare `a`, `b`, `c`, still load; the next download rewrites them with the new IDs.

### Adjusting the look

Above the picture:

| Control | Effect |
|---|---|
| **Label styling ▾** | Size and colour of headings and counts |
| **Unify grid sizes** + height | Every row of panels the same height |
| **Unify inner panel** + height | Every row inside a panel the same height; crowded cells overlap their dots and show **+N** if some need scrolling |
| **Show item counts** | Number of records in each panel; "9 of 12 items" when a filter hides some of them |
| **Show dimension names** | Names of the dimensions along the edges |

Press **B** to hide or show the sidebar.

### Saving your work

| Button | You get | Use it for |
|---|---|---|
| **Download CSV** | `edited_data.csv` | Your data, with any changes and comments |
| **Change Log → CSV / JSON** | `change_log.*` | A record of every change you made |
| **Export setup** | `plew-setup-….json` | The arrangement: placements, filters, order, colours, display options |
| **📷 Dark / Light** | `grid_snapshot.png` | The picture, with a legend, for slides or papers |
| **📷 Stacked / Side-by-side** (in a record) | a PNG of that record | Illustrating one example. If the record's image is hosted on another site, pressing the button fetches it through the image service `wsrv.nl`, which is therefore told the image's address. Nothing is sent there unless you press one of these two buttons |
| **Report** | `report.html` | Counts, percentages and cross-tabulations of whole dimensions |

The data and the setup are separate files. To pick up where you left off, load the CSV, then **Import setup**.

> **Good to know.** The downloaded CSV has one more column than you started with (`desc::comment`) and the anchor rows at the bottom. The report always covers all records, whatever is filtered.

### Quick reference

| | |
|---|---|
| Hover | summary |
| Click | open record (A) |
| Shift+click | compare with (B) |
| Drag dot | move to another category |
| Right-click dot | change its colour/shape value |
| Drag ⋮ on a heading | reorder values |
| B | sidebar |
| Esc | close |
| Ctrl/⌘+Z, Ctrl/⌘+Shift+Z | undo, redo |

### If something looks wrong

| What you see | Likely reason | What to do |
|---|---|---|
| "No dimensions assigned" | Nothing is placed | Give at least one dimension a placement |
| A column is missing from Dimensions | PLeW took it for an ID, a text field or media. This happens when every row is different, or the name contains "name", "title" or "description" | **Column roles ▾** → set it to **Dimension** |
| A text column was made a dimension | It has repeated values | **Column roles ▾** → **Description** |
| Extra records called `a`, `b`, `c` … at the end | An old PLeW file whose anchors could not be recognised with certainty, so they were kept as data to be safe | Delete those rows from the CSV, or rename their IDs to `__anchor__a`, `__anchor__b` … |
| The last few rows are missing | Their IDs are exactly `a`, `b`, `c` … in order and their other columns are empty, so they were read as old-style anchors | Give those rows different IDs |
| Sound or images do not load | The file cannot be found from where the CSV is | Use **Load media files…**, or full `https://` links |
| Rows are broken after re-loading | A comment contained a line break | Keep comments on one line for now |
| Snapshot does nothing | The snapshot helper needs an internet connection | Check the connection and try again |

---

## Part 2 — Preparing and sharing data

### What a good file looks like

- **CSV**, with a header row. Tab, semicolon or `|` separated files are detected too. JSON (a list of objects) and JSONL also load.
- **One row per observation.**
- **First column: a unique ID.** Numbers, codes or words are all fine. Do not use IDs that begin with `__anchor__`; PLeW reserves those for its own placeholder rows.
- **Category columns** with a modest number of repeated values. These become dimensions.
- Save as **UTF-8**.

Everything is treated as text. `1` and `1.0` are different values.

### Telling PLeW what a column is

PLeW guesses from column names. To decide yourself, put a prefix on the header:

| Header | Meaning |
|---|---|
| `dim::Function` | A dimension, always |
| `desc::notes` | Descriptive text: shown in the record window, never placed |
| `med::recording` | A media link |
| `res::annotator` | Kept in the file, kept out of the way |

You can also set these in **Column roles ▾**; downloading the CSV writes the prefixes for you.

Without a prefix, columns named like `audio_url`, `image_file`, `video`, `transcript`, `translation`, `gloss`, `description` are recognised automatically.

### Media

A media cell can hold:

- a full link (`https://…`), including a YouTube address;
- a path to a file on the same site (see below);
- a file name, if you load the media files alongside the CSV.

Supported: common audio (`wav`, `mp3`, `ogg`, `flac`, `m4a`), image (`jpg`, `png`, `gif`, `webp`, `svg`) and video (`mp4`, `webm`, `mov`) formats.

### Sharing an example page

The [README](../README.md) has the step-by-step version. In outline:

1. Fork the repository and switch on GitHub Pages (source: GitHub Actions).
2. Put your CSV in `static/data/` and media in `static/<your-name>/`. Media cells should read `<your-name>/clip1.wav`. (`tools/prefix_media_paths.py` adds that prefix for you.)
3. Add `content/examples/<your-name>.md`:

   ```toml
   +++
   title = "My dataset"
   description = "One or two sentences for the gallery card."
   dataset_url = "data/<your-name>.csv"
   config_url = "config/<your-name>.json"   # optional
   layout = "example-viz"
   weight = 10
   +++
   ```

4. Optional: arrange the view as you want readers to first see it, **Export setup**, save the file under `static/config/`, and point `config_url` at it.
5. Push to `main`. The site rebuilds, and your page is at `…/examples/<your-name>/`.

Readers get the full tool. Whatever they rearrange or edit stays in their own browser.

> **Good to know.** If you changed column roles before exporting the setup, publish the CSV you downloaded from that same session, so the column names match.

---

## Part 3 — Working on PLeW itself

### Running it

```bash
hugo server
```

Then open `http://localhost:1313/`. Hugo Extended 0.128 is what the deploy workflow uses. The tool is plain HTML, CSS and JavaScript; there is nothing to install or build beyond that.

### Where things are

| File | What |
|---|---|
| `layouts/index.html` | The editor (upload your own data) |
| `layouts/_default/example-viz.html` | The example page (data loaded from front matter) |
| `layouts/examples/list.html` | The gallery |
| `layouts/_default/doc.html`, `content/guide.md`, `content/design.md`, `content/code-map.md` | The help pages. Their text comes from `docs/`; edit it there |
| `tools/code-userguide-review.md` | The procedure for checking the documents against the code |
| `content/examples/*.md` | One per example |
| `static/data/`, `static/<name>/` | Example data and media |
| `docs/` | These documents, and the test CSVs for known problems |

> **The two layout files are near-identical copies.** Until they are merged, **every change must be made in both.** `diff layouts/index.html layouts/_default/example-viz.html` should only ever show the differences listed in the [code map §12](01-code-map.md#12-the-two-files).

### How the code is organised

Read the [code map](01-code-map.md) first. The short version:

- One `<script>`, global functions, global state declared in the `STATE` section.
- **Loading** goes through `processParsedRows()`.
- **Every redraw** goes through `updateVisualization()`, which rebuilds the picture from state.
- **Assignment** of dimensions lives in `dimensionEncodings`; `buildEncodings()` derives the working `encodings` object.
- **Any data edit** must: write to `currentData`, add to `modifiedRows`, call `pushUndoAction()`, call `logChange()`, call `updateChangesIndicator()`, then `updateVisualization()`.
- **Newer features** are fenced with `// --- FEATURE: name (start) ---` … `(end)`.

### Adding something

1. Read the [design guide](03-design-guide.md) and go through its checklist.
2. Add state in the `STATE` section, with a comment saying what it holds and what it is keyed by (column header, or display name).
3. Put the code between `FEATURE` markers.
4. If the setting should travel with a shared view, add it to `buildVisualizationConfig()` and `applyConfigState()`, and raise `VIZ_CONFIG_VERSION`. Older files must still load.
5. Reset it in `processParsedRows()` if it should not survive loading a new file.
6. Make the same change in the other layout file.
7. Use the interface vocabulary in labels (design guide, principle 7).
8. When the change is finished and reviewed, run the review procedure in [`tools/code-userguide-review.md`](../tools/code-userguide-review.md). It checks that the tool still works, finds every place in these documents that the change has made untrue, and updates the verification stamp. Put its report in the pull request.

### Checking your change by hand

There are no automated tests yet. The review procedure above includes a fuller smoke test; at minimum:

- Load `static/data/zoo.csv` in the editor; open the matching example page.
- Place a dimension in each of the six placements; filter one value from each.
- Drag a dot, right-click a dot, add a comment; undo all three; redo.
- Download the CSV, load it again: same number of records, anchors recognised.
- Export the setup, reload the data, import the setup: same picture.
- Take a dark and a light snapshot.
- Collapse the sidebar; check the floating buttons and legend.

### Contributing

Work on a branch and open a pull request against `main`. Pushing to `main` deploys the site, so `main` should always be in a working state.
