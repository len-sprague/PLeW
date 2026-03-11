# PLeW
(previously betterviz)

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
   cd C:\Projects\plew\betterviz
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

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| "hugo is not recognized" | Install Hugo and open a **new** PowerShell window. |
| "cannot find path" | Check that the path in the `cd` command matches your project folder. |
| Page won't load | Make sure the PowerShell window with `hugo server` is still open. |
| Port 1313 in use | Run `hugo server --port 1314` and use http://localhost:1314/ instead. |
