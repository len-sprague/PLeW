# Test files for findings A1–A9

One small CSV per finding in group A of the [streamlining report](02-streamlining-report.md), so that anyone can see the failure for themselves **before** a fix is made, and confirm it is gone afterwards.

- The finding numbers here match the report's exactly.
- Every result below was reproduced on `layouts/index.html` at commit `01f1fd4`, driving the real interface (file picker, dropdowns, tick boxes, drag) in a headless browser.
- Load each file in the **editor** (the main page), by dropping it on the *Data Input* box. Reload the page between files so that no settings carry over.
- "Dots" means records drawn in the picture. Anchors are hidden by default and are not dots.

| Finding | File | Failure in one line |
|---|---|---|
| A1 | `A1-panel-filter-single-value.csv` | Hiding two of three panel values shows all 6 records, not 2 |
| A2 | `A2a-lowercase-first-column.csv` | 4 rows load as 0 records |
| A2 | `A2b-lowercase-trailing-ids.csv` | 6 rows load as 4 records |
| A3 | `A3-hidden-record-count.csv` | 4 dots drawn, header says "8 records" |
| A4 | `A4-export-differs.csv` | Downloaded file has an extra column, extra rows and, after a role change, a moved column |
| A5 | `A5-multiline-and-quotes.csv` | 4 rows load as 5; quotation marks vanish |
| A6 | `A6-colour-follows-value.csv` | A colour chosen under one dimension reappears under another |
| A7 | `A7-palette-repeats.csv` | 12 values, 10 colours, 4 shapes: values share colours and shapes |
| A8 | `A8-drag-discards-dropdown.csv` | Dragging the dimension list undoes a dropdown choice |
| A9 | `A9-image-proxy.csv` | Opening a record contacts `wsrv.nl` |

---

## A1 — Panel filter with one value left shows everything

**File:** `A1-panel-filter-single-value.csv` — 6 records: two speakers (Ana, Ben) × three vowels (a, i, u), one record each.

**Steps**

1. Load the file. PLeW puts *Vowel* on grid X and *Speaker* on grid Y.
2. In **Dimensions**, set *Vowel*'s dropdown to **panel X**. Each speaker's panel now has three columns: a, i, u. 6 dots.
3. Tick **Show item counts** (above the picture).
4. In **Filter values → Vowel**, untick **u**.
5. Untick **i**.

**Expected:** 6 dots → 4 dots → 2 dots (only the *a* records).

**What happens**

| After step | Dots | Column headings |
|---|---|---|
| 2 | 6 | a, i, u |
| 4 | 4 | a, i |
| 5 | **6** | a |

After step 5 every record is back, all under the heading **a**. Hover over the dots: you will find *Vowel: i* and *Vowel: u* sitting in the *a* column.

**Also visible here:** after step 4 each panel draws 2 dots but its count still reads **"3 items"**. Item counts ignore panel X / panel Y filters (related to A3).

**Cause:** the `length > 1` tests in `createpanelCell` (lines 6641, 6644).

---

## A2 — Lowercase first column is mistaken for anchors

Two files, showing the two forms this takes.

### A2a — the whole file disappears

**File:** `A2a-lowercase-first-column.csv` — 4 records. The first column, `word`, holds lowercase words (cat, dog, run, eat).

**Steps:** load the file.

**Expected:** 4 records, with *Class* and *Tone* as dimensions.

**What happens:** the picture reads **"No dimensions assigned"** and the Dimensions list is empty. All four rows have been taken for anchor rows, leaving 0 records. The **Anchor Points** section in the sidebar reads "4 anchors".

(If another file was loaded first without reloading the page, the header above the picture keeps showing that earlier file's record count.)

### A2b — the last rows disappear

**File:** `A2b-lowercase-trailing-ids.csv` — 6 records with IDs 1, 2, 3, 4, x, y.

**Steps:** load the file.

**Expected:** 6 records.

**What happens:** the header reads **"4 records • 0 modified • 2 anchors"** and 4 dots are drawn. Rows `x` and `y` are gone from the data, with no message.

**Cause:** `detectExistingDummies` (line 4659) treats trailing rows whose first cell is only the letters a–z as anchors.

---

## A3 — Nothing says how many records are hidden

**File:** `A3-hidden-record-count.csv` — 8 records: two groups (A, B) × two tones (high, low), two records each.

**Steps**

1. Load the file. *Group* is on grid X, *Tone* on grid Y. 8 dots.
2. In **Filter values → Group**, untick **B**.

**Expected:** some sign that half the data is hidden, such as "4 of 8 records shown".

**What happens:** 4 dots are drawn; the header still reads **"8 records • 0 modified • 2 anchors"**. The only trace of the filter is "1 of 2 values" beside *Group* in the Dimensions list, which is out of sight if the sidebar is collapsed and absent from a snapshot.

**Cause:** `renderVisualization` (line 6311) reports `data.length`, the number loaded.

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

**Cause:** `generateCSV` (line 4190) takes column order from the first row object, and `renameColumnKey` (line 5088) deletes and re-adds the key.

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

**Cause:** `parseCSV` (line 4078) splits the text into lines before looking at quotes; `parseDelimitedLine` (line 4114) drops every quotation mark.

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

**Cause:** `customColorMap` is keyed by the value alone (lines 4999, 6071). Custom shapes behave the same way (line 5007).

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

**Cause:** `getColorForValue` / `getShapeForValue` (lines 4998–5012) pick by position in the value order, wrapping round.

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

**Cause:** `handleDimDrop` calls `autoAssignEncodingsFromOrder()` (line 5490).

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

**Cause:** `renderCompareModal` calls `preloadModalImages` (line 7279), which calls `getSnapshotFetchUrl` (line 7245).

---

## After a fix

Each file doubles as the check that its fix worked: repeat the steps and the "Expected" line should now be what happens. Two of them will need their expectations revisited once the fix is designed, because the fix changes the format rather than just the behaviour:

- **A2** — depends on how anchors come to be marked. Both files should then load in full (4 and 6 records).
- **A4** — depends on whether the comment column and anchor rows become optional at download.
