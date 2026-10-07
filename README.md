# PLeW
(previously BetterViz)

Interactive multi-dimensional data visualizer. Load CSV data, map dimensions to axes, and explore in a grid of scatter plots.

## Quick start

1. **Install Hugo Extended** — Windows: `winget install Hugo.Hugo.Extended` (or [download](https://github.com/gohugoio/hugo/releases))
2. **Open a terminal** in the project folder and run:
   ```
   hugo server
   ```
3. **Open in browser:** http://localhost:1313/

**Useful links:**
- **Full editor** (upload your own CSV): http://localhost:1313/
- **Examples:** http://localhost:1313/examples/
- **Kourosh demo:** http://localhost:1313/examples/kourosh/

---

## First time? Step-by-step guide

If you’ve never used a terminal or installed software like this before, follow these steps.

### 1. Install Hugo

Hugo is a small program that builds and runs the visualizer. You only need to install it once.

**Option A — Windows (recommended):**
1. Press the **Windows key**, type **PowerShell**, and open it.
2. Copy and paste this, then press **Enter**:
   ```
   winget install Hugo.Hugo.Extended --accept-package-agreements --accept-source-agreements
   ```
3. When it finishes, **close PowerShell and open a new one** so your computer recognizes Hugo.

**Option B — Manual download:**  
Go to [Hugo releases](https://github.com/gohugoio/hugo/releases), download `hugo_extended_X.X.X_windows-amd64.zip`, unzip it, and put `hugo.exe` in a folder that’s in your PATH.

### 2. Open a terminal and go to the project folder

1. Open **PowerShell** (Windows key → type “PowerShell”).
2. Type this (change the path if your project is elsewhere) and press **Enter**:
   ```
   cd C:\Projects\PLeW
   ```
3. The prompt should show that folder. If you see “cannot find path”, check that the path is correct.

### 3. Start the visualizer

1. Type this and press **Enter**:
   ```
   hugo server
   ```
2. You should see: **Web Server is available at http://localhost:1313/**
3. **Leave this window open** while you use the visualizer.

### 4. Open it in your browser

1. Open Chrome, Edge, or Firefox.
2. In the address bar, type: **http://localhost:1313/** and press **Enter**.

**To stop:** Go back to the PowerShell window and press **Ctrl+C**.

---

## Sharing your own example dataset

If you have your own data and want collaborators to explore it in PLeW — without them needing to install anything — you can host your own copy of this site and add your dataset as a new example page. Once it's live, you just send collaborators a link.

### Step 1: Get your own copy of PLeW online

1. On GitHub, **fork this repository** into your own GitHub account (button in the top-right of the repo page).
2. In your fork, go to **Settings → Pages**, and under "Build and deployment", set **Source** to **GitHub Actions**. (This repo already includes the workflow file that builds the site with Hugo — you don't need to write one yourself.)
3. Push any commit to your fork's **main** branch (even a small one, like editing this README) to trigger the first build. You can watch its progress under the **Actions** tab.
4. After the build finishes (usually 1–2 minutes), your own PLeW site will be live at:
   ```
   https://<your-github-username>.github.io/<your-repo-name>/
   ```
   Bookmark this — it's your permanent home for examples going forward.

### Step 2: Add a new example dataset

Each example page is just a CSV file plus a small text file that tells PLeW about it — no coding required.

1. **Prepare your CSV.** Save it as `static/data/<your-dataset-name>.csv`. Column names generally just work as-is: PLeW auto-detects columns like `audio_url`, `image_url`, or `video_url` as media, and columns like `transcript`, `translation`, `gloss`, or `description` as descriptive text (shown in the detail popup rather than plotted). If you want to force a specific column's treatment regardless of its name, prefix the header with:
   - `dim::` — always treat as a plottable dimension (e.g. `dim::Function`)
   - `med::` — always treat as media, audio/image/video/YouTube link (e.g. `med::recording`)
   - `desc::` — always treat as descriptive text, shown in the popup only (e.g. `desc::notes`)
2. **Add any media files** (audio, image, video) referenced by your CSV into a new folder under `static/`, e.g. `static/<your-dataset-name>/`. In the CSV, reference them with a path relative to `static/`, e.g. `<your-dataset-name>/clip1.wav` — or use a full `https://` link (including YouTube URLs).
   If your CSV only lists bare filenames (e.g. `clip1.wav`), see [Prefixing media filenames](#prefixing-media-filenames-with-the-csv-name) below.
3. **Create the content page.** From a terminal in the project folder, run:
   ```
   hugo new content/examples/<your-dataset-name>.md
   ```
   Open the new file and remove the `draft = true` line so it will actually publish. Fill in the rest:
   ```toml
   +++
   title = "My Dataset"
   description = "A short description shown on the example gallery card."
   dataset_url = "data/<your-dataset-name>.csv"
   config_url = "data/<your-json-config-filename>.json"
   layout = "example-viz"
   weight = 10
   date = 2026-01-01
   +++
   ```
   `weight` controls where the page appears in the example gallery (lower numbers first).
4. **(Optional) Ship a pre-calibrated setup.** If you've already arranged the dimension mappings, encodings, filters, and styling the way you want, click "Export setup" in the sidebar to download a `plew-setup-*.json` file. Save it as `static/config/<your-dataset-name>.json` (or anywhere under `static/`), then add `config_url = "config/<your-dataset-name>.json"` to the front matter above. When someone opens the page, PLeW loads the dataset first and then automatically applies that setup — no manual "Import setup" click needed.
5. **Test locally.** Run `hugo server`, then open `http://localhost:1313/examples/<your-dataset-name>/` and confirm your data loads, your dimensions look right, and any media plays correctly. Adjust column names/prefixes as needed.

### Step 3: Publish and share

1. Commit your changes and push them to your fork (directly to `main`, or via a pull request into your own `main` if you prefer to review first).
2. Once the changes are on `main`, GitHub Actions automatically rebuilds and redeploys your site — no extra steps needed.
3. Your new dataset will be live at:
   ```
   https://<your-github-username>.github.io/<your-repo-name>/examples/<your-dataset-name>/
   ```
4. Share that link directly with collaborators — it opens straight into the visualizer with your dataset already loaded, no upload required.

---

## Prefixing media filenames with the CSV name

PLeW looks up relative media paths from the `static/` folder, so for a dataset `21.csv` whose media sits in `static/21/`, the CSV cells must read `21/clip1.wav`, not just `clip1.wav`. If your CSVs were exported with bare filenames, `tools/prefix_media_paths.py` adds the prefix for you.

1. Download `tools/prefix_media_paths.py` and put it in a folder together with the CSVs you want to fix. Use a working copy of your CSVs: the script overwrites them in place.
2. Open a terminal in that folder and run (Python 3 is the only requirement):
   ```
   python prefix_media_paths.py
   ```
   Add `--dry-run` to preview without saving, or pass a folder path to process CSVs somewhere else.
3. For each CSV, in alphabetical order, the script lists the columns that look like media (`audio_url`, `image_url`, `med::…`, etc.) with a few before/after examples, then asks, e.g. `Prefix 'audio_url' in 21.csv with '21/'? [y/n/q]`. Type `y` to edit that column, `n` (or just Enter) to skip it, or `q` to quit. Files already saved stay saved.
4. Copy the fixed CSVs to `static/data/` and the media files to the matching `static/<csv-name>/` folders.

Empty cells, full `https://` links (including YouTube), paths starting with `/`, and filenames that already start with the CSV name are left untouched, so running the script twice is safe.

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| "hugo is not recognized" | Install Hugo and open a **new** PowerShell window. |
| "cannot find path" | Check that the path in the `cd` command matches your project folder. |
| Page won't load | Make sure the PowerShell window with `hugo server` is still open. |
| Port 1313 in use | Run `hugo server --port 1314` and use http://localhost:1314/ instead. |
