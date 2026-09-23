# Source Attribution Matrix & Conflict Resolution Policy

This reference documents the human-authored source repositories that form the foundation of this skill, delineates their distinct responsibilities, catalogs potential disagreements, and establishes an evidence-based conflict resolution policy.

---

## 1. Primary Source Repositories & Responsibilities

| Source Repository | Core Philosophy & Domain Responsibility | Key Upstream Foundations |
|---|---|---|
| **1. Microsoft `frontend-design-review`**<br>`github.com/microsoft/skills` | **Evaluation Pillars & Review Governance**<br>- 3 Quality Pillars (Frictionless, Quality Craft, Trustworthy).<br>- Systematic audit workflows & structured review output formats.<br>- 3-tier severity classification (Blocking, Major, Minor). | @Quirinevwm quality framework, Anthropic frontend-design skill |
| **2. Vercel `web-design-guidelines`**<br>`github.com/vercel-labs/agent-skills` | **Code-Level Standards & Mechanical Precision**<br>- Granular HTML/CSS/DOM compliance rules.<br>- Focus visibility (:focus-visible, no bare outline-none).<br>- Form ergonomics, image dimensions (CLS prevention), and anti-patterns.<br>- Terse `file:line` error reporting. | Vercel Web Interface Guidelines |
| **3. Xialiang98 `design-visual-frontend`**<br>`github.com/Xialiang98/design-visual-frontend` | **Rendered Evidence & Non-Compensating Hard Gates**<br>- 5-viewport verification matrix (`390x844` to `2560x1080`).<br>- 8 Non-compensating Hard Review Gates (Gates A through H).<br>- "Weakest Critical Dimension Rule" (no averaging away severe flaws).<br>- Explicit fallback protocol when browser tooling is unavailable. | Modern web responsive standards, visual inspection methodology |
| **4. NextLevelBuilder `ui-ux-pro-max-skill`**<br>`github.com/nextlevelbuilder/ui-ux-pro-max-skill` | **Design Intelligence, Tokens & Priority Hierarchy**<br>- Priority 1→10 rule hierarchy (Accessibility & Touch → Data/Charts).<br>- WCAG 2.2 Level AA / AAA criteria (Focus Not Obscured, Target Size).<br>- Platform design guidelines (Apple HIG, Google Material Design 3).<br>- List virtualization for large collections (>50 items). | Apple Human Interface Guidelines, Google Material Design 3, WCAG 2.2 |
| **5. overseek944 `frontend-ui-ux-skill`**<br>`github.com/overseek944/frontend-ui-ux-skill` | **HCI Foundations & Quantitative Usability Laws**<br>- Nielsen's 10 Usability Heuristics.<br>- Quantitative laws: Fitts's Law (44px target), Hick's Law (<=7 items), Miller's Law (chunks of 3-5), Jakob's Law, Peak-End Rule.<br>- 5 Integrated Disciplines (Interaction, Visual, Architecture, A11y, Performance).<br>- 10-point Definition-of-Done gate. | Nielsen Norman Group, Fitts (1954), Hick (1952), Miller (1956), Core Web Vitals |

---

## 2. Precedence Order

When conducting reviews, apply rules in this strict order of precedence (overseek944 & Microsoft):

$$\text{1. Explicit User Instructions} \longrightarrow \text{2. Project System & Tokens (Kura tokens in \texttt{tokens.css})} \longrightarrow \text{3. Human-Authored Reference Standards}$$

The reference doctrine fills gaps; it never overrides an explicit project design token or direct user requirement without documenting the rationale.

---

## 3. Disagreement Catalog & Resolution Policy

If two referenced sources disagree on a recommendation, the skill must:
1. **Record the disagreement** in the audit report.
2. **Explain the context** of the disagreement.
3. **Select the appropriate standard** based on Kura's specific content-heavy manga/video application context.
4. **Justify the decision** clearly with evidence.

### Documented Tension Points & Kura Resolution:

#### A. Touch Target Size: 24×24px vs 44×44px / 48×48dp
- **Disagreement**:
  - *WCAG 2.2 SC 2.5.8* (via NextLevelBuilder & Vercel) sets **24×24 CSS px** as the minimum accessibility requirement.
  - *Apple HIG & Fitts's Law* (via overseek944 & NextLevelBuilder) mandate **44×44pt / 48×48dp** for touch targets.
- **Resolution for Kura**:
  - For **primary mobile navigation, floating reader controls, bottom dock, and video playback controls**: Enforce **44×44px** (Fitts's Law) for effortless thumb reach.
  - For **dense secondary metadata items, chapter list pagination chips, and desktop tag clouds**: Allow **24×24px** minimum provided there is >=8px inter-target spacing.
- **Rationale**: Kura is frequently used on mobile devices in one-handed reading contexts; primary reading actions require large touch targets to prevent reader frustration.

#### B. Content Density vs Generous Whitespace
- **Disagreement**:
  - *General SaaS / Landing Page Guidelines* (Microsoft & Xialiang98) favor generous whitespace and controlled low information density.
  - *Media & Catalog Interfaces* (NextLevelBuilder `entertainment` domain & overseek944) favor high visual density for browsing extensive manga collections and chapter lists.
- **Resolution for Kura**:
  - Enforce **content-dense grids and lists** for catalog, chapter lists, and episode rails, but maintain **generous negative space in reader mode and video player** to prevent cognitive overload.
  - Reject generic SaaS dashboard spacing when reviewing manga card grids.
- **Rationale**: Manga readers and video catalogs prioritize visual scanning and immediate access to series volumes over corporate dashboard spacing.

#### C. Visual Embellishments (Glassmorphism & Gradients) vs Strict Minimalism
- **Disagreement**:
  - *Anthropic / overseek944* warn against gratuitous glassmorphism and ambient glow as generic "AI slop".
  - *Kura Design System & Microsoft Creative Frontend* utilize curated dark glass surfaces (`--kura-surface-glass: rgba(23, 24, 28, 0.85)`, `--kura-dock-glass`) to provide depth over manga covers and video streams.
- **Resolution for Kura**:
  - Allow glassmorphism **only on floating overlay surfaces** (floating header, bottom mobile dock, reader HUD) where background cover art or video stream passes underneath.
  - Prohibit glassmorphism on standard catalog cards, settings pages, and reading canvas.
- **Rationale**: Overlay blur serves a functional role (maintaining underlying spatial context) without cluttering static content cards.

#### D. Heading Line Wrapping (`text-wrap: balance` vs Natural Breaking)
- **Disagreement**:
  - *Vercel Guidelines* recommend `text-wrap: balance` or `text-wrap: pretty` on all headings to eliminate typographic widows.
  - *NextLevelBuilder CJK & Long-Token Rules* note that `text-wrap: balance` can cause unpredictable multi-line wrapping on Asian typography (Japanese/Chinese/Korean manga titles) or mixed romaji strings.
- **Resolution for Kura**:
  - Use `text-wrap: balance` on UI section titles and modal headers.
  - For manga/anime titles, use standard wrapping with `overflow-wrap: anywhere` and `-webkit-line-clamp: 2` to preserve natural title flow across Latin, Japanese Kanji/Kana, and Korean Hangul scripts.
- **Rationale**: Prevents awkward single-character line wraps common in East Asian media catalog titles.
