# WinBack Design System (design.md)

This document defines the visual language for WinBack, per ERD Part 2 §12. Tokens live in `src/app/globals.css`; fonts are loaded in `src/app/layout.tsx`.

## 1. Direction: "IC Memo"

WinBack should look like a well-typeset investment committee memo, not a generic SaaS dashboard. The product's promise is that every number is cited or calculated, so the interface borrows the visual language of a trusted financial document:

- **Warm paper, deep ink.** A paper ground with navy ink, never pure white on grey.
- **A serif voice.** Headings, key figures, pull quotes and memo text are set in a serif. UI chrome and body copy stay in a sober sans.
- **Amber as a highlighter pen.** Evidence, gaps and "look at this" moments are marked up the way an analyst would mark a printout. Amber never means "bad".
- **Rules, not boxes.** Sections are separated by hairlines and a heavy ink rule under each page masthead. Cards are reserved for things that are genuinely objects (a document, the memo, a form).

**Density stance:** dense and professional. Data density, readability and information scent beat airy whitespace inside tables and findings; generous space goes *between* sections.

## 2. Colour tokens

| Token | Light | Use |
|---|---|---|
| `--background` / `--paper` | `#f5f1e8` | Page ground |
| `--card` / `--popover` | `#fbf9f3` | A sheet laid on the paper (cards, memo, drawer) |
| `--foreground` / `--primary` / `--rule` | `#15213a` | Ink: text, primary buttons, heavy rules |
| `--muted` / `--secondary` / `--sidebar` | `#ede7da` | Rail and quiet fills |
| `--accent` | `#e7e0d0` | Hover fills, bar tracks |
| `--muted-foreground` | `#5a6070` | Secondary text (≥4.5:1 on paper) |
| `--border` | `#d9d1c0` | Hairlines |
| `--input` | `#c9bfab` | Control borders |
| `--destructive` | `#a3392a` | Errors only |
| `--highlight` | `rgb(246 196 69 / .5)` | Highlighter fill: status pills, marked figures, cited passages, selection |

**Semantic states (descriptive, not evaluative):**
- `--above-median` `#2a55b8` and `--below-median` `#6a43b5`: position against the peer median only. Always paired with an icon and a label.
- `--inline-median` `#5a6070`.
- `--attention` `#e0a526` with `--attention-foreground` `#5a3d04`: "look at this", never "this is bad". No red/green verdict colouring anywhere.

A `.dark` token set exists for completeness but no theme toggle ships today.

## 3. Typography

- **Serif (headings, figures, quotes, memo):** Source Serif 4, via `font-heading` / `font-serif`.
- **Sans (UI and body):** IBM Plex Sans, via `font-sans`.
- **Mono (document references, filenames, provenance hashes only):** IBM Plex Mono, via `font-mono`. Never as decoration.
- **Scale:** page titles 40–44px serif semibold, tracking −0.02em; section titles 24px serif; finding titles 28–32px; key figures 44–52px serif with a smaller unit suffix; body 15–16px at 1.6–1.7 line height, measure capped near 70ch.
- **Figures:** all tables get `tabular-nums lining-nums` globally. A difference between two percentages is written in **pts**.

## 4. Layout

- **App shell:** a 240px paper rail (`Sidebar`) with the serif wordmark, the active deal, and the pipeline stages with completion ticks and a review count. Below `md` it collapses to a horizontal strip.
- **Content:** `max-w-6xl`, generous side padding (`px-4` → `px-16`).
- **Page masthead:** `PageHeader` (`src/components/app-shell/page-header.tsx`): serif title, one-line standfirst, optional right-hand slot, closed by a 2px ink rule.
- **Analysis:** benchmark and portfolio impact stack; they sit side by side (7/5) only at `2xl`.
- **Signed-out pages:** `AuthFrame`: ink panel with the product promise beside a paper panel holding the form.

## 5. Components

- **Buttons:** 2–4px radius. Primary is solid ink; outline uses `--input` borders; "link" is an underlined text action. Sizes: `sm` 32px, default 36px, `lg` 44px.
- **Crosscheck finding:** the centrepiece. Workstream and status pill above a serif title; management's claim as an italic serif pull quote with its source chip; the records as a numbered list of citations (each opens the evidence drawer); claimed / observed / gap as large serif figures, the gap marked with highlighter; for percentages, a 0–100 bar with the gap hatched in amber; suggested memo language on a card in serif; accept / dismiss / edit wording.
- **Evidence chip:** small squared chip, sans, file icon. Hover/active fill with `--highlight`.
- **Derived marker (ƒ):** round serif-italic marker that opens the formula and inputs.
- **Evidence drawer:** paper header with serif document title; cited block filled with `--highlight` at 35%, exact quote marked with full highlight.
- **IC memo:** a single sheet with a serif title, status badge (Draft / Analyst edited / Approved), serif body, and `- ` lines rendered as a real bulleted list.
- **Audit trail:** a vertical timeline; dot colour encodes the actor (ink = analyst, amber = model, sand = system).
- **Coming soon workstreams:** hairline-topped entries, visibly inert, labelled "Not in this release".

## 6. States

- **Loading:** `StatusNote`, a ruled line with a pulsing amber dot and staged, honest copy ("Classifying documents…"). Skeletons use `--accent`. Never a single centred spinner.
- **Empty / prerequisite:** `EmptyNote`, a serif title, one line of explanation and the action that resolves it.
- **Error:** `ErrorNote`, a calm destructive-tinted box with the message and a Retry action.
- **Mock data:** a "Mock data" badge in the sidebar, filled with `--highlight`, whenever any stage used a mocked LLM call.

## 7. Motion

- Findings, panels and the memo fade in (`animate-in fade-in duration-300`).
- The evidence drawer uses the standard sheet transition.
- The running-stage dot pulses. No other ambient animation.
