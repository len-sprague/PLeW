# PLeW documentation

Documents produced from a full read of the visualizer (`layouts/index.html` and `layouts/_default/example-viz.html`).

| Document | For | What it answers |
|---|---|---|
| [01 — Code map](01-code-map.md) | Anyone reading or changing the code | What every part is, what state it touches, and how the parts depend on each other |
| [02 — Streamlining report](02-streamlining-report.md) | Maintainers | Where the tool repeats itself or works against its own goals; suggested fixes, risks and an order to do them in |
| [03 — Design guide](03-design-guide.md) | Contributors, and anyone building in the same spirit | The manifesto, the rules that follow from it, and a checklist for changes |
| [04 — User guide](04-user-guide.md) | Users, data preparers, new contributors | How to use PLeW, prepare and share data, and work on the tool |
| [05 — Test files for findings A1–A9](05-finding-test-files.md) | Anyone checking a finding or a fix | One small CSV per group-A finding (`A1-….csv` to `A9-….csv` in this folder), with steps, the expected result and what actually happens |

**Suggested reading order:** the manifesto (Part 1 of the design guide) for the *why*; the user guide for the *what*; the code map for the *how*; the report for *what next*.

## On the site

The user guide, design guide and code map are also published as pages beside the tool, at `/guide/`, `/design/` and `/code-map/`, and linked from **Help** under the tool's title. Those pages are built from the files in this folder, so there is one copy of the text: **edit it here.** The wording is still a first draft, pending the writing style guide.

## Keeping these documents true

The procedure in [`tools/code-userguide-review.md`](../tools/code-userguide-review.md) checks every document here against the current code, and checks that the tool still works. It is written for a language model or a person to follow. Run it after any change to the tool, before opening the pull request.

### Verification stamp

The documents were last checked against these exact versions of the tool files. Each hash is the output of `git hash-object <file>`; if the command prints something different today, the code has changed since the documents were checked.

| File | Lines | Blob hash |
|---|---|---|
| `layouts/index.html` | 7953 | `e61483a75ca3071a1960f50591cf2df9d940cec4` |
| `layouts/_default/example-viz.html` | 7744 | `16f9625d68add8d21dcd74838e6124a6f8c751ab` |

**Checked on:** 2026-11-16 · **Reason:** help links added to both files; line numbers in the documents shifted to match.
