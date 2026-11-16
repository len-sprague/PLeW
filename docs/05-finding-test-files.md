# Test files for findings A1–A9

One small CSV per finding in group A of the [streamlining report](02-streamlining-report.md), so that anyone can see the failure for themselves **before** a fix is made, and confirm it is gone afterwards.

- The finding numbers here match the report's exactly.
- Every result below was reproduced on `layouts/index.html` (see the verification stamp in [docs/README.md](README.md)), driving the real interface (file picker, dropdowns, tick boxes, drag) in a headless browser.
- Load each file in the **editor** (the main page), by dropping it on the *Data Input* box. Reload the page between files so that no settings carry over.
- "Dots" means records drawn in the picture. Anchors are hidden by default and are not dots.

| Finding | File | Failure in one line |
|---|---|---|
| A1 ✅ fixed | `A1-panel-filter-single-value.csv` | Was: hiding two of three panel values showed all 6 records, not 2. Now shows 2 |
| A2 ✅ fixed | `A2a-lowercase-first-column.csv` | Was: 4 rows loaded as 0 records. Now 4 |
| A2 ✅ fixed | `A2b-lowercase-trailing-ids.csv` | Was: 6 rows loaded as 4 records. Now 6 |
| A2 (check) | `A2c-old-style-anchors.csv` | A file in the old anchor format still loads as 4 records + 2 anchors |
| A2 (check) | `A2d-more-than-26-anchors.csv` | 30 anchors: IDs run past `__anchor__z` to `__anchor__aa` |
| A3 | `A3-hidden-record-count.csv` | **Fixed.** Before: 4 dots drawn, header says "8 records" |
| A4 | `A4-export-differs.csv` | Downloaded file has an extra column, extra rows and, after a role change, a moved column |
| A5 | `A5-multiline-and-quotes.csv` | 4 rows load as 5; quotation marks vanish |
| A6 | `A6-colour-follows-value.csv` | A colour chosen under one dimension reappears under another |
| A7 | `A7-palette-repeats.csv` | 12 values, 10 colours, 4 shapes: values share colours and shapes |
| A8 | `A8-drag-discards-dropdown.csv` | Dragging the dimension list undoes a dropdown choice |
| A9 | `A9-image-proxy.csv` | Opening a record contacts `wsrv.nl` |

---

## A1 — Panel filter with one value left shows everything

> **Fixed** in the pull request *A1 resolution attempt #1*. The steps below now give the expected result. The description of the failure is kept so the fix can be checked against it, and so the failure can be recognised if it ever returns.

**File:** `A1-panel-filter-single-value.csv` — 6 records: two speakers (Ana, Ben) × three vowels (a, i, u), one record each.

**Steps**

1. Load the file. PLeW puts *Vowel* on grid X and *Speaker* on grid Y.
2. In **Dimensions**, set *Vowel*'s dropdown to **panel X**. Each speaker's panel now has three columns: a, i, u. 6 dots.
3. Tick **Show item counts** (above the picture).
4. In **Filter values → Vowel**, untick **u**.
5. Untick **i**.

**Expected:** 6 dots → 4 dots → 2 dots (only the *a* records).

**What happens now (after the fix)**

| After step | Dots | Column headings |
|---|---|---|
| 2 | 6 | a, i, u |
| 4 | 4 | a, i |
| 5 | **2** | a |

Both remaining dots have *Vowel: a*.

**What happened before the fix**

| After step | Dots | Column headings |
|---|---|---|
| 2 | 6 | a, i, u |
| 4 | 4 | a, i |
| 5 | **6** | a |

After step 5 every record was back, all under the heading **a**. Hovering over the dots showed *Vowel: i* and *Vowel: u* sitting in the *a* column.

**Also visible here, fixed with A3:** after step 4 each panel draws 2 dots and its count reads **"2 of 3 items"**; after step 5, 1 dot and **"1 of 3 items"**. Before the fix for A3 the count read "3 items" throughout, because item counts ignored panel X / panel Y filters.

**Cause:** two `&& … .length > 1` conditions in `createpanelCell` (lines 6744 and 6747), which skipped the row test when only one value was visible. The fix removes them.

---

## A2 — Lowercase first column is mistaken for anchors

> **Fixed** in the pull request *A2 resolution attempt #1*. Anchors are now marked with a reserved ID (`__anchor__a`, `__anchor__b` …) and recognised only by it. The steps below now give the expected result; the old failures are kept for comparison.

Two files show the two forms the failure took. Two more check the parts of the fix that are easy to get wrong: reading old files, and needing more than 26 anchors.

To see the anchors themselves in any of these, press **Download CSV** and look at the last rows of the file, or tick **Show on chart** under **Anchor Points** in the sidebar.

### A2a — the whole file disappears

**File:** `A2a-lowercase-first-column.csv` — 4 records. The first column, `word`, holds lowercase words (cat, dog, run, eat).

**Steps:** load the file.

**Expected:** 4 records, with *Class* and *Tone* as dimensions.

**What happens now (after the fix):** the header reads **"4 records • 0 modified • 2 anchors"** and 4 dots are drawn. Downloading the CSV gives the four rows followed by two rows with the IDs `__anchor__a` and `__anchor__b`.

**What happened before the fix:** the picture read **"No dimensions assigned"** and the Dimensions list is empty. All four rows had been taken for anchor rows, leaving 0 records. The **Anchor Points** section in the sidebar read "4 anchors".

### A2b — the last rows disappear

**File:** `A2b-lowercase-trailing-ids.csv` — 6 records with IDs 1, 2, 3, 4, x, y.

**Steps:** load the file.

**Expected:** 6 records.

**What happens now (after the fix):** the header reads **"6 records • 0 modified • 2 anchors"** and 6 dots are drawn, including `x` and `y`.

**What happened before the fix:** the header read **"4 records • 0 modified • 2 anchors"** and 4 dots were drawn. Rows `x` and `y` were gone from the data, with no message.

**Cause:** `detectExistingDummies` treated any trailing rows whose first cell was only the letters a–z as anchors. It now looks for the reserved ID instead.

### A2c — a file in the old format still loads

**File:** `A2c-old-style-anchors.csv` — 4 records with IDs 1–4, followed by two anchor rows written the old way: IDs `a` and `b`, a value in each dimension, and the `note` column empty.

**Steps:** load the file, then press **Download CSV** and open the result in a text editor.

**Expected, and what happens (before and after the fix):** the header reads **"4 records • 0 modified • 2 anchors"**. Rows `a` and `b` are read as anchors, not as records.

**What is new after the fix:** in the downloaded file those two rows now have the IDs `__anchor__a` and `__anchor__b`.

**A limit to know about:** rows at the very end of a file whose IDs are exactly `a`, `b`, `c` … and which have values only in dimension columns cannot be told apart from old-style anchors, and are still read as anchors. This is the one case the fix cannot settle from the file alone.

**Why these two rows are accepted when `x`, `y` in A2b are not:** old-style anchors are recognised only when the last rows' IDs are exactly `a`, `b`, `c` … in order, at least one other row comes before them, the first column is not itself a dimension, and those rows have values only where an anchor would (in dimension columns; everything else empty). To see the last condition at work, type anything into the `note` cell of row `a` in a copy of this file: it then loads as 6 records.

### A2d — more than 26 anchors

**File:** `A2d-more-than-26-anchors.csv` — 60 records; the *Item* column has 30 different values, so 30 anchors are needed.

**Steps:** load the file, press **Download CSV**, and look at the last 30 rows.

**Expected, and what happens after the fix:** the header reads **"60 records • 0 modified • 30 anchors"**. The anchor IDs run `__anchor__a` … `__anchor__z`, then `__anchor__aa`, `__anchor__ab`, `__anchor__ac`, `__anchor__ad`. Loading the downloaded file gives 60 records and 30 anchors again.

(Before the fix the IDs were `a` … `z`, `aa` … `ad`.)

---

## A3 — Nothing says how many records are hidden

> **Fixed** in the pull request *A3 resolution attempt #1*. The steps below now give the expected result; the old result is kept for comparison.

**File:** `A3-hidden-record-count.csv` — 8 records: two groups (A, B) × two tones (high, low), two records each.

**Steps**

1. Load the file. *Group* is on grid X, *Tone* on grid Y. 8 dots.
2. In **Filter values → Group**, untick **B**.
3. Tick **Show item counts** (above the picture).
4. Tick **B** again. In **Dimensions**, set *Tone*'s dropdown to **panel X**, then in **Filter values → Tone** untick **low**.
5. Under **Anchor Points**, tick **Show on chart**.

**Expected:** some sign that half the data is hidden, such as "4 of 8 records shown".

**What happens now (after the fix)**

| After step | Dots | Header | Panel counts |
|---|---|---|---|
| 1 | 8 | 8 records • 0 modified • 2 anchors | (2 items in each of four panels, once switched on) |
| 2 | 4 | **4 of 8 records shown (filtered by Group)** • 0 modified • 2 anchors | |
| 3 | 4 | the same | 2 items ; 2 items |
| 4 | 4 | **4 of 8 records shown (filtered by Tone)** • 0 modified • 2 anchors | **2 of 4 items** ; **2 of 4 items** |
| 5 | 4 | the same | 2 of 4 items (+1⚓) ; 2 of 4 items |

After step 2 the two remaining panels each draw all of their own records, so their counts read "2 items"; the four hidden records belong to panels that are not drawn, and only the header can report them. After step 5 one anchor is drawn (the other belongs to the hidden value *low*); it is reported beside the count and is not part of "2 of 4" or of "4 of 8".

**What happened before the fix**

| After step | Dots | Header | Panel counts |
|---|---|---|---|
| 2 | 4 | 8 records • 0 modified • 2 anchors | |
| 4 | 4 | 8 records • 0 modified • 2 anchors | 4 items ; 4 items |
| 5 | 4 | 8 records • 0 modified • 2 anchors | 4 items (+1⚓) ; 4 items (+1⚓) |

The only trace of a filter was "1 of 2 values" beside the dimension in the Dimensions list, which is out of sight if the sidebar is collapsed and absent from a snapshot. With *Tone* on colour or shape instead of panel X, the panel counts did drop (to "2 items") but did not say out of how many. In step 5 the second panel reported an anchor that was not drawn.

**Cause:** `renderVisualization` reported `data.length`, the number loaded, and `creategrid` counted a panel's records before its cells were filled, applying only the colour, shape and comment filters. The fix writes both counts after drawing, from the dots drawn.

---

## A4 — The exported CSV differs from the input

**File:** `A4-export-differs.csv` — 4 records, columns `ID, Group, Tone, note`.

### Part 1: no edits at all

**Steps:** load the file, then press **Download CSV** straight away. Open `edited_data.csv` in a text editor.

**Expected:** the same four columns and four rows.

**What happens**

```
ID,Group,Tone,note,desc::comment
1,A,high,first note,
2,A,low,second note,
3,B,high,third note,
4,B,low,fourth note,
a,A,high,,
b,B,low,,
```

One extra column (`desc::comment`, empty) and two extra rows (the anchors `a` and `b`).

### Part 2: after changing a column's role

**Steps:** open **Column roles ▾** (above the picture), set *Tone* to **Description**, then **Download CSV** again.

**Expected:** `Tone` renamed to `desc::Tone`, still the third column.

**What happens**

```
ID,Group,note,desc::comment,desc::Tone
1,A,first note,,high
…
```

The column has moved to the far right.

**Cause:** `generateCSV` (line 4191) takes column order from the first row object, and `renameColumnKey` (line 5186) deletes and re-adds the key.

---

## A5 — Line breaks and quotation marks inside a cell

**File:** `A5-multiline-and-quotes.csv` — 4 records. This is a valid CSV. Record 2's note is a quoted cell containing a line break; record 3's note contains quotation marks, written `""hello""` as the CSV format requires.

**Steps:** load the file. Click the dots to read each record's fields.

**Expected:** 4 records. Record 2's note is "first line / second line". Record 3's note is `she said "hello" twice`.

**What happens**

- The header reads **"5 records"**.
- Grid X has **three** columns: an unnamed blank one, then A and B. The blank column holds a stray record whose ID is `second line"` and whose other fields are empty.
- Record 2's note is cut short at "first line".
- Record 3's note reads `she said hello twice`: the quotation marks are gone.

**Why it matters for PLeW's own files:** a comment typed with a line break is exported in exactly this form, so a file saved by PLeW can fail to load in PLeW. To see that route instead, load any file, open a record, type a two-line comment, download the CSV and load it again.

**Cause:** `parseCSV` (line 4079) splits the text into lines before looking at quotes; `parseDelimitedLine` (line 4115) drops every quotation mark.

---

## A6 — Custom colours follow the value, not the dimension

**File:** `A6-colour-follows-value.csv` — 8 records. *Focus* and *Canonical* are separate columns that both use the values `0` and `1`.

**Steps**

1. Load the file.
2. In **Dimensions**, set *Focus* to **Color**.
3. In the sidebar's **Color: Focus** legend, click the swatch beside **0** and pick black.
4. Set *Canonical* to **Color**.

**Expected:** *Canonical* starts with the default colours. The black belonged to *Focus = 0*.

**What happens:** the legend now reads **Color: Canonical**, and its `0` is black as well.

**Cause:** `customColorMap` is keyed by the value alone (lines 5097, 6174). Custom shapes behave the same way (line 5105).

---

## A7 — Colours and shapes repeat without warning

**File:** `A7-palette-repeats.csv` — 24 records: 12 languages × 2 tasks.

### Colours

**Steps:** load the file and set *Language* to **Color**. Look at the sidebar legend.

**What happens:** there are 10 default colours for 12 values.

| Share a colour | |
|---|---|
| Arabic and Korean | teal |
| Basque and Latvian | red |

Nothing in the legend or the picture says so.

### Shapes

**Steps:** set *Language* to **Shape**.

**What happens:** there are 4 shapes for 12 values, so each shape stands for three languages: circle = Arabic, Estonian, Italian; square = Basque, Finnish, Japanese; diamond = Czech, Greek, Korean; triangle = Dutch, Hindi, Latvian.

### Reordering changes the colours

**Steps:** set *Language* back to **Color**. In **Filter values → Language**, drag **Korean** to the top of the list.

**What happens:** Korean stays teal, but Arabic turns from teal to red, Basque from red to yellow, and so on down the list. A picture made before the reorder and one made after use different colours for the same languages.

**Cause:** `getColorForValue` / `getShapeForValue` (lines 5096–5110) pick by position in the value order, wrapping round.

---

## A8 — Dragging the dimension list discards dropdown choices

**File:** `A8-drag-discards-dropdown.csv` — 6 records, four dimensions.

**Steps**

1. Load the file. The placements are: *Region* grid X, *Tone* grid Y, *Mood* Color, *Size* panel X.
2. Set *Size*'s dropdown to **Shape**.
3. Drag *Tone* (by its **⋮⋮** handle) onto *Region*, so that *Tone* is first in the list.

**Expected:** *Tone* and *Region* swap; *Size* stays on Shape, as chosen.

**What happens**

| | Region | Tone | Mood | Size |
|---|---|---|---|---|
| After step 1 | grid X | grid Y | Color | panel X |
| After step 2 | grid X | grid Y | Color | **Shape** |
| After step 3 | grid Y | grid X | Color | **panel X** |

*Size* is back on panel X. The hint above the list says "Use the dropdown to override", but any drag re-deals every placement from the top.

**Cause:** `handleDimDrop` calls `autoAssignEncodingsFromOrder()` (line 5593).

---

## A9 — Opening a record contacts a third party

**File:** `A9-image-proxy.csv` — 4 records, each with an `image_url` pointing at a public image on Wikimedia Commons.

**Steps**

1. Open the browser's developer tools and go to the **Network** tab (F12 in most browsers).
2. Load the file.
3. Clear the network list, then click any dot to open its record. Do **not** press a snapshot button.

**Expected:** one request, to `upload.wikimedia.org`, for the image being displayed.

**What happens:** two requests.

```
https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png
https://wsrv.nl/?url=https%3A%2F%2Fupload.wikimedia.org%2F…
```

The second sends the image's address to `wsrv.nl`, an image proxy, to prepare a copy for a snapshot that has not been asked for. With a researcher's own media, those addresses may be private.

Images served from the same site as PLeW (as on the example pages) are not sent to the proxy; this affects images on other hosts.

**Cause:** `renderCompareModal` calls `preloadModalImages` (line 7382), which calls `getSnapshotFetchUrl` (line 7348).

---

## After a fix

Each file doubles as the check that its fix worked: repeat the steps and the "Expected" line should now be what happens. Two of them will need their expectations revisited once the fix is designed, because the fix changes the format rather than just the behaviour:

- **A2** — done: both files load in full (4 and 6 records).
- **A4** — depends on whether the comment column and anchor rows become optional at download.
