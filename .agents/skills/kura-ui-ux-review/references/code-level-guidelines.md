# Code-Level & Implementation Guidelines

This reference compiles granular, code-verifiable rules for frontend markup, styling, interaction, and accessibility compliance.

*Primary sources: Vercel `web-interface-guidelines`, NextLevelBuilder `ui-ux-pro-max-skill`, WCAG 2.2 Level AA.*

---

## 1. Accessibility & Semantic HTML

- **Semantic Navigation vs Action**: Use `<a>` (or router link) for navigation; use `<button>` for actions. Never use `<div>` or `<span>` with click handlers without button semantics.
- **Images**: Every `<img>` needs an `alt` attribute. Use descriptive text for content images; use `alt=""` for purely decorative illustrations.
- **Decorative Icons**: Decorative icons (e.g., icons next to text labels) must have `aria-hidden="true"`.
- **Icon-Only Buttons**: Any button containing only an icon (e.g. close button, bookmark toggle, theme toggle) must have an explicit `aria-label` or `aria-labelledby`.
- **Live Regions**: Asynchronous state updates (e.g., toast alerts, dynamic search results, background chapter download status) must use `aria-live="polite"` (or `role="status"`).
- **Heading Hierarchy**: Headings must follow strict sequential order `<h1>` -> `<h6>` without skipping levels.
- **Skip Link**: Top-level page layout must provide a skip link to main content (`<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>`).
- **Heading Anchors**: Scrollable anchor targets must have `scroll-margin-top` to prevent being obscured by fixed headers.

---

## 2. Focus States & Keyboard Operability

- **Focus Visibility**: Interactive elements must provide a visible focus indicator using `:focus-visible` (e.g., `outline: 2px solid var(--kura-accent)` or `focus-visible:ring-2`).
- **Never Bare Outline None**: Never write `outline: none` or `outline: 0` without an explicit `:focus-visible` replacement.
- **Pointer Focus Suppression**: Use `:focus-visible` instead of `:focus` to avoid showing persistent focus rings on mouse/touch clicks.
- **Compound Controls**: Use `:focus-within` to highlight search input groups and compound control containers.
- **Focus Not Obscured (WCAG 2.2 SC 2.4.11 / 2.4.12)**: Sticky headers, bottom docks, and floating overlays must not cover keyboard-focused elements when tabbing through content.

---

## 3. Forms & Inputs

- **Labels**: Every input must be programmatically associated with a `<label>` (via `for`/`id` or enclosing the `<input>`).
- **Input Types & Modes**: Use appropriate `type` (`search`, `email`, `number`, `url`) and `inputmode` for mobile keyboard matching.
- **Never Block Paste**: Never intercept and prevent paste events on inputs or search bars (`onPaste` + `preventDefault()`).
- **Spellcheck Discipline**: Set `spellcheck="false"` on search inputs, usernames, license keys, and API tokens.
- **Async Action Feedback**: Submit buttons must remain enabled until request dispatch, display a spinner during in-flight requests, and gracefully recover on error.
- **Inline Errors**: Form errors must be positioned adjacent to the invalid input, connected via `aria-describedby`, and receive focus or screen-reader announcement upon validation failure.

---

## 4. Animation & Motion

- **Reduced Motion**: All animations and transitions must honor `@media (prefers-reduced-motion: reduce)`. Provide instant state changes or gentle cross-fades under reduced motion.
- **Compositor-Friendly Properties**: Only animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `margin`, or `padding` directly.
- **Explicit Transitions**: Never use `transition: all`. Explicitly specify animated properties (e.g. `transition: transform 160ms var(--ease-out), opacity 160ms ease`).
- **Transform Origin**: Explicitly declare `transform-origin` when scaling or rotating elements (especially SVGs).
- **Interruptibility**: Animations must be cancellable and respond immediately to subsequent user input without waiting for transition completion.

---

## 5. Typography & Microcopy (Style & Polish Standards)

> *Note: Microcopy and typographic formatting guidelines represent editorial style polish (Severity: Minor), not hard technical accessibility blockers.*

- **Ellipsis Entity**: Prefer the standard unicode ellipsis character `…` (`&hellip;`) over three periods `...`.
- **Loading Copy**: Standardize loading states to end with an ellipsis: `"Loading…"`, `"Buffering…"`, `"Searching…"`.
- **Tabular Numerals**: Apply `font-variant-numeric: tabular-nums` to chapter counters, video timestamps, progress percentages, and file sizes to eliminate layout jitter during counter updates.
- **Balanced Headings**: Use `text-wrap: balance` or `text-wrap: pretty` on UI section headers and modal titles to prevent single-word widows.
- **Non-Breaking Spaces**: Use non-breaking spaces (`&nbsp;`) between numbers and units (e.g., `12&nbsp;MB`, `45&nbsp;min`, `Vol.&nbsp;1`).

---

## 6. Content Handling & Overflow

- **Text Truncation**: Text containers displaying dynamic user or scraper content must handle long strings via `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` or `-webkit-line-clamp`.
- **Flex Child Shrinking**: Flex children displaying truncated text must have `min-width: 0` (`min-w-0`) to allow flex shrinking and prevent horizontal layout blowout.
- **Long Words & URLs**: Apply `overflow-wrap: anywhere` or `word-break: break-word` to user comments and synopsis text.
- **Empty State Resilience**: Every collection or list must render a graceful, informative empty state when arrays are empty (`length === 0`), rather than collapsing into a blank or broken layout.

---

## 7. Images, Video & Performance

- **CLS Prevention**: All `<img>` and `<video>` elements must have explicit `width` and `height` attributes or a CSS `aspect-ratio` container (e.g. `aspect-ratio: 2/3` for manga covers, `aspect-ratio: 16/9` for video thumbnails).
- **Lazy Loading**: Use `loading="lazy"` on below-the-fold covers and reader pages. Use `fetchpriority="high"` on above-the-fold hero covers.
- **Virtualization**: Long lists (>50 items, such as 500+ chapter lists or massive manga catalogs) must be virtualized or paginated to preserve DOM performance and scroll responsiveness.
- **Layout Reads in Render Loops**: Never perform layout reads (`getBoundingClientRect()`, `offsetHeight`, `scrollTop`) inside hot render loops or reactive watchers without requestAnimationFrame batching.

---

## 8. Safe Areas, Touch & Mobile Layout

- **Safe Area Insets**: Fixed-position elements (headers, bottom docks, floating action buttons) must incorporate `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- **Touch Manipulation**: Set `touch-action: manipulation` on buttons and interactive cards to eliminate the mobile 300ms double-tap delay.
- **Modal Containment**: Modal sheets and drawer containers must have `overscroll-behavior: contain` to prevent background page scroll chaining.
- **Touch Target Floor**: Interactive elements must meet minimum touch dimensions of **44×44px** on mobile or have hit areas expanded via pseudo-elements (`::after`).

---

## 9. Dark Mode & Theming

- **Root Color Scheme**: The root element or body must declare `color-scheme: dark` to ensure native browser scrollbars and inputs render in dark styling.
- **Theme Color Meta**: Set `<meta name="theme-color" content="#0E0F12">` to match the Kura midnight background.
- **Windows Dark Mode Form Controls**: Native `<select>` and `<option>` elements must have explicit background and text color tokens.

---

## 10. Code-Level Anti-Patterns Checklist

When scanning code, flag these specific anti-patterns immediately:

- ❌ `<meta name="viewport" content="... user-scalable=no">` (disabling zoom)
- ❌ `onPaste={(e) => e.preventDefault()}` (blocking paste)
- ❌ `transition: all` (uncontrolled style thrashing)
- ❌ `outline: none` without `:focus-visible` replacement
- ❌ `<div @click="...">` or `<span @click="...">` without `role="button"` and `tabindex="0"`
- ❌ `<img>` without `width`/`height` or `aspect-ratio`
- ❌ Large `v-for` or `.map()` (>50 items) without virtualization
- ❌ Icon button without `aria-label` or `title`
- ❌ Hardcoded `#hex` or `rgb()` color bypassing Kura design tokens
