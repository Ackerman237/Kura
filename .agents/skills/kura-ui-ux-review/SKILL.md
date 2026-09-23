---
name: kura-ui-ux-review
description: >-
   Audits and reviews the UI/UX quality, accessibility, visual hierarchy, responsiveness, and interaction design of Kura (content-heavy manga/video web app) against established human-authored standards. Orchestrates guidelines from Microsoft frontend-design-review, Vercel web-design-guidelines, Xialiang98 design-visual-frontend, NextLevelBuilder UI/UX Pro Max, and overseek944 frontend-ui-ux-skill. Use when asked to "review UI", "audit UX", "check accessibility", "evaluate responsive layout", "review manga reader UI", "inspect design system compliance", or "audit frontend quality".
---

# Kura Evidence-Based UI/UX Review Orchestrator

An evidence-based UI/UX review workflow for **Kura** (content-heavy manga/video application). This skill serves strictly as an **orchestrator of established, human-authored design standards**, synthesizing proven industry frameworks without inventing novel design heuristics, scores, or ungrounded visual rules.

---

## 1. Foundational Sources & Attribution

This skill orchestrates five primary human-authored repositories and their foundational standards:

1. **Microsoft `frontend-design-review`** ([`references/evaluation-framework.md`](./references/evaluation-framework.md)): Three Quality Pillars (*Frictionless*, *Quality Craft*, *Trustworthy*), systematic review governance, and severity classification (*Blocking*, *Major*, *Minor*).
2. **Vercel `web-design-guidelines`** ([`references/code-level-guidelines.md`](./references/code-level-guidelines.md)): Granular HTML/CSS/DOM rules, `:focus-visible`, form ergonomics, CLS prevention, and clickable `file:line` issue formatting.
3. **Xialiang98 `design-visual-frontend`** ([`references/viewport-visual-protocol.md`](./references/viewport-visual-protocol.md)): 5-viewport browser verification matrix (`390x844` to `2560x1080`), 8 Non-compensating Hard Review Gates, Weakest Critical Dimension Rule, and fallback verification rules.
4. **NextLevelBuilder `ui-ux-pro-max-skill`** ([`references/evaluation-framework.md`](./references/evaluation-framework.md)): Priority 1→10 rule hierarchy, WCAG 2.2 Level AA criteria (Focus Not Obscured, Target Size), Apple HIG/Material Design 3 platform norms, and list virtualization.
5. **overseek944 `frontend-ui-ux-skill`** ([`references/design-laws-heuristics.md`](./references/design-laws-heuristics.md)): Nielsen's 10 Usability Heuristics, quantitative laws (Fitts's, Hick's, Miller's, Jakob's, Peak-End Rule), 5-discipline integration, and 10-point Definition-of-Done.

Full attribution and conflict resolution policies are documented in [`references/source-attribution-conflicts.md`](./references/source-attribution-conflicts.md).

---

## 2. Review Mode Workflow (Audit-Only)

> [!IMPORTANT]
> **Audit-First Principle**: This skill is strictly for **auditing existing UI**. Do NOT modify source code or implement redesigns during the audit unless explicitly requested by the user.

Follow this 8-step review workflow:

```
+----------------------------------------------------------------------------------------------------+
| 1. Understand User Task & Surface                                                                  |
|    Identify the surface archetype (Catalog, Reader, Video Player, Detail View, Settings) and job. |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+----------------------------------------------------------------------------------------------------+
| 2. Inspect Kura Design System & Tokens                                                             |
|    Verify CSS variables in src/web/styles/tokens.css (--kura-bg, --kura-accent, --kura-text-*).     |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+----------------------------------------------------------------------------------------------------+
| 3. Inspect UI Implementation & Code Quality                                                        |
|    Review Vue 3 components, composables, styles, accessibility markup, and edge-case handling.      |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+----------------------------------------------------------------------------------------------------+
| 4. Launch Application (When Executable)                                                            |
|    Start local server (npm run dev:web) to enable live inspection and visual validation.           |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+----------------------------------------------------------------------------------------------------+
| 5. Multi-Viewport Inspection & Screenshot Evidence                                                |
|    Test across 390x844, 768x1024, 1440x900, 1920x1080, 2560x1080 viewports.                         |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+----------------------------------------------------------------------------------------------------+
| 6. Evaluate Against 8 Hard Gates & Usability Heuristics                                            |
|    Apply non-compensating Gates A-H and Nielsen's 10 Heuristics. Weakest dimension rules.          |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+----------------------------------------------------------------------------------------------------+
| 7. Check Kura Media/Reader Domain Rules                                                           |
|    Inspect aspect ratios (2:3 / 16:9), reader focus, chapter lists, privacy mode, and dark theme.   |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+----------------------------------------------------------------------------------------------------+
| 8. Synthesize Evidence-Based Audit Report                                                          |
|    Output structured findings, severity breakdown, and actionable recommendations.                |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Visual & Browser Verification Protocol

When browser automation/screenshot tools are active in the environment:
1. Render the real page across the 5 viewports:
   - `390x844` (Mobile navigation, touch targets >=44px, safe area insets)
   - `768x1024` (Tablet reflow, drawer transitions, modal sizing)
   - `1440x900` (Standard desktop composition, sidebar expansion)
   - `1920x1080` (Widescreen space allocation, player proportions)
   - `2560x1080` (Ultrawide cinematic framing, container max-width)
2. Inspect computed DOM styles for token compliance and contrast.
3. Test keyboard navigation (`Tab`, `Shift+Tab`, `Space`, `Enter`, `Esc`).
4. Record visual evidence in the format:
   $$\text{Observation} \longrightarrow \text{Cause} \longrightarrow \text{Structural Treatment} \longrightarrow \text{Recheck Viewport}$$

### Browser Tooling Fallback:
If browser automation or screenshot capture is unavailable:
- **Explicitly state** at the start of the report that visual findings are derived from source code, CSS tokens, and component structure rather than rendered screenshots.
- Provide the user with a concise manual verification checklist for the 5 viewports ([`references/viewport-visual-protocol.md`](./references/viewport-visual-protocol.md)).
- **Never** invent or simulate rendered visual logs.

---

## 4. Conflict Resolution Policy

If two referenced standards offer divergent guidance:
1. Record the disagreement explicitly in the audit report.
2. Favor the standard best aligned with Kura's media/reader context:
   - *Touch Targets*: 44×44px for primary mobile dock/reader controls (Fitts's Law); 24×24px floor for dense desktop chips.
   - *Information Density*: High density for manga grids and chapter lists; generous focus for reading/watching canvas.
   - *Glassmorphism*: Restricted to floating overlay HUDs over media; prohibited on opaque content cards.
   - *Typographic Wrapping*: `text-wrap: balance` for UI headers; natural breaking with `overflow-wrap: anywhere` for Asian manga titles.
3. Document the rationale in the report (see [`references/source-attribution-conflicts.md`](./references/source-attribution-conflicts.md)).

---

## 5. Standard Audit Report Template

Every audit conducted using this skill must follow this evidence-based structure:

```markdown
# UI/UX Audit Report: [Surface / Component / View Name]

## 1. Context & Task
- **Surface Archetype**: [Catalog / Detail / Reader / Video Player / Settings]
- **Primary User Job**: [e.g., Discover manga series and filter by genre]
- **Stack & Tokens**: Vue 3 (`<script setup>`) + Kura Design Tokens (`src/web/styles/tokens.css`)
- **Visual Evidence Status**: [Rendered Browser Evidence (Viewports Verified) | Source Code Analysis (Manual Verification Required)]

## 2. Quality Pillar & Hard Gate Assessment

| Pillar / Dimension | Status | Evaluated Standards | Notes / Observations |
|---|---|---|---|
| **Frictionless Action** | 🟢 / 🟠 / ⚫ | Task completion <=3 steps, 1 primary CTA | [Notes] |
| **Visual Craft & Tokens** | 🟢 / 🟠 / ⚫ | Kura tokens, type scale, spatial rhythm | [Notes] |
| **Architecture & Code** | 🟢 / 🟠 / ⚫ | Semantic HTML, Vercel guidelines, Vue reactivity | [Notes] |
| **Accessibility (WCAG 2.2)** | 🟢 / 🟠 / ⚫ | Focus rings, contrast >=4.5:1, touch >=44px | [Notes] |
| **Performance & Speed** | 🟢 / 🟠 / ⚫ | CLS < 0.1, list virtualization, image aspect-ratio | [Notes] |

*Legend: 🟢 Pass | 🟠 Needs Work (Major) | ⚫ Blocking Issue (Critical)*

### Non-Compensating Hard Gates (Xialiang98):
- **Gate A (5-Second Clarity)**: [Pass / Fail]
- **Gate B (Protagonist & Action)**: [Pass / Fail]
- **Gate C (Spatial Completion)**: [Pass / Fail]
- **Gate D (Cliché Budget <= 1)**: [Pass / Fail]
- **Gate E (Content Truth & Domain Fit)**: [Pass / Fail]
- **Gate F (Typography & Contrast)**: [Pass / Fail]
- **Gate G (Product Reality & a11y)**: [Pass / Fail]
- **Gate H (Engineering Integrity)**: [Pass / Fail]

**Weakest Critical Dimension**: [Name the lowest-scoring gate/dimension and its visible impact]

## 3. Discrepancies & Source Disagreements (If Applicable)
- [Document any standard divergence, selected option, and Kura domain rationale]

## 4. Prioritized Findings

### 🔴 Blocking (Must Fix Before Release)
1. `src/path/to/File.vue:line` - [Issue description based on WCAG / Hard Gate / User Task Failure + Specific Code Fix Recommendation]

### 🟠 Major (Should Fix)
1. `src/path/to/File.vue:line` - [Issue description based on Kura Token / Heuristic / Fitts's Law + Specific Code Fix Recommendation]

### 🟡 Minor (Polish & Refinement)
1. `src/path/to/File.vue:line` - [Issue description based on Microcopy / Spacing / Typography + Specific Code Fix Recommendation]

## 5. Actionable Recommendations & Design Token References
- [Concrete component or token adjustments referencing Kura CSS variables]
```

---

## 6. Reference Links
- [`references/sources.md`](./references/sources.md) - Exact verified sources, URLs, and authority mapping
- [`references/evaluation-framework.md`](./references/evaluation-framework.md) - Multi-Pillar framework & 8 Hard Gates
- [`references/design-laws-heuristics.md`](./references/design-laws-heuristics.md) - Nielsen's 10 heuristics & Quantitative HCI laws
- [`references/viewport-visual-protocol.md`](./references/viewport-visual-protocol.md) - Viewport matrix & browser inspection protocol
- [`references/code-level-guidelines.md`](./references/code-level-guidelines.md) - Code-level rules, focus states, and anti-patterns
- [`references/kura-domain-checklist.md`](./references/kura-domain-checklist.md) - Kura media, reader, video, and catalog checks
- [`references/source-attribution-conflicts.md`](./references/source-attribution-conflicts.md) - Source repository attribution and conflict policy
