# Evaluation Framework & Multi-Pillar Architecture

This reference synthesizes the evaluation frameworks from our primary human-authored sources into a cohesive, evidence-based audit protocol.

---

## 1. The Core Multi-Pillar Framework (Microsoft `frontend-design-review` + overseek944 `frontend-ui-ux`)

Every UI review evaluates five integrated dimensions without treating them as isolated silos:

```
+-----------------------------------------------------------------------------------+
|                            KURA UI/UX AUDIT DOCTRINE                              |
+-----------------------------------------------------------------------------------+
|  1. Frictionless Insight-to-Action  | Task completion <=3 steps, singular primary |
|                                     | CTA, zero dead ends (Microsoft / overseek)  |
+-----------------------------------------------------------------------------------+
|  2. Visual System & Quality Craft   | Kura tokens, type scale, spatial hierarchy, |
|                                     | dark palette harmony (Microsoft / overseek) |
+-----------------------------------------------------------------------------------+
|  3. Architecture & Code Compliance  | Semantic HTML, Vercel guidelines, Vue 3     |
|                                     | composables, state integrity (Vercel)       |
+-----------------------------------------------------------------------------------+
|  4. Accessibility (WCAG 2.2 AA)     | Keyboard nav, focus rings, contrast >=4.5:1,|
|                                     | touch targets >=44px (NextLevel / overseek) |
+-----------------------------------------------------------------------------------+
|  5. Performance & Perceived Speed   | Core Web Vitals (LCP/CLS/INP), list virt,   |
|                                     | skeleton states (NextLevel / Vercel)        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Hard Non-Compensating Review Gates (Xialiang98 `design-visual-frontend`)

Visual audit findings must pass all 8 hard gates. A high score on one gate cannot compensate for a failure on another ("Weakest Critical Dimension Rule"):

### Gate A: Five-Second Clarity
- At each viewport, answer within 5 seconds:
  1. What is this surface?
  2. What content/source does it belong to?
  3. What is the single primary action?
  4. What is the continuation/next step?
- *Failure condition*: Giant decorative banners, ambiguous icons, or unbalanced whitespace delaying the answer on discovery, search, or reader views.

### Gate B: Protagonist and Action
- The dominant user task determines the protagonist:
  - Catalog/Home -> Content discovery & search
  - Manga Detail -> Chapter selection & metadata inspection
  - Reader -> Unobstructed page reading & navigation
  - Cinema/Watch -> Video player & episode switching
- Short tasks must show the primary control without scrolling at `390x844`.

### Gate C: Spatial Completion & Region Roles
- Every major desktop region (`1440`, `1920`, `2560`) must have a functional, evidentiary, or narrative role.
- *Failure condition*: Fixed-width cards stranded in expanding empty oceans on ultrawide monitors without responsive grid reflow.

### Gate D: Cliché Budget & Authenticity
- Distinguish between **functional atmospheric styling** (Kura dark glassmorphism on floating HUDs/dock over video/manga canvases) and **gratuitous decorative clutter** (floating neon orbs, pseudo-terminal effects, decorative particle grids):
  - *Legitimate Media UI*: Semi-transparent frosted glass (`--kura-dock-glass`, `--kura-surface-glass`) is permitted on floating overlays where media content passes underneath.
  - *Failure condition*: Decorative gimmicks that obstruct cover readability, slow rendering frame rates, or masquerade as content. Strip purely decorative motifs that have no functional, spatial, or readability purpose.

### Gate E: Content Truth & Domain Fit
- Kura interfaces must use real manga/anime metadata (cover aspect ratios `2:3` or `3:4`, chapter numbers, tags, video durations, source providers).
- *Failure condition*: Broken layouts when handling extremely long titles (e.g., light novel titles with 100+ characters) or missing cover images.

### Gate F: Typography, Color & Material
- Legible line measure (45–75 characters per line).
- Unified Kura token usage (`--kura-bg`, `--kura-surface`, `--kura-accent`, `--kura-text-primary`).
- Contrast ratio >= 4.5:1 for body copy and >= 3:1 for large headings/UI boundaries.
- No hardcoded hex or raw pixel values bypassing CSS custom properties.

### Gate G: Product Reality & Accessibility
- Test edge cases:
  - 0 items (empty state)
  - 10,000 items (virtualized scroll performance)
  - Network error / Provider timeout (actionable recovery)
  - Keyboard focus visibility (`:focus-visible`)
  - Screen reader semantic markup (`aria-label` on icon buttons, `aria-live` on toasts)
  - Reduced motion (`prefers-reduced-motion: reduce`)

### Gate H: Engineering & DOM Integrity
- Semantic HTML tags (`<button>`, `<a>`, `<nav>`, `<main>`, `<header>`) rather than clickable `<div>` elements.
- No layout thrashing or synchronous layout reads in render loops.
- Explicit image width/height or CSS `aspect-ratio` to maintain CLS < 0.1.

---

## 3. Priority Hierarchy & Severity Classification

When classifying issues, use the standardized 3-tier severity matrix (Microsoft & overseek944):

| Severity | Definition | Action Required |
|---|---|---|
| **Blocking (Critical)** | Violates WCAG 2.2 AA, breaks core user task (e.g. reader cannot turn pages, video cannot play), causes severe layout crash or crash loop. | Must be fixed before release. |
| **Major (Needs Work)** | Degrades usability (e.g. missing focus ring, touch target < 44px on mobile, hardcoded color token, unhandled long text wrap). | Should be prioritized in the current sprint. |
| **Minor (Refinement)** | Small aesthetic inconsistency (e.g. slight spacing irregularity, icon stroke mismatch, microcopy polish). | Address during routine UI polish. |
