# Verified Sources & Authority Mapping: Kura UI/UX Review

This document records the exact, verified human-authored references and standards used as the foundation for `kura-ui-ux-review`. No rules, heuristics, or design laws were invented.

---

## 1. Verified Sources Table

| Topic | Source | Exact URL | File/Path | What was verified | Authority Classification | Used for |
|---|---|---|---|---|---|---|
| **Quality Pillars & Review Governance** | Microsoft `frontend-design-review` | `https://github.com/microsoft/skills` | `.github/skills/frontend-design-review/SKILL.md`<br>`references/review-output-format.md` | Three Quality Pillars (*Frictionless*, *Quality Craft*, *Trustworthy*), systematic review governance, and 3-tier severity classification (*Blocking*, *Major*, *Minor*). | `COMMUNITY PRACTICE` | Overall review workflow, quality pillar framework, and severity matrix. |
| **Code-Level & DOM Precision** | Vercel `web-design-guidelines` | `https://github.com/vercel-labs/web-interface-guidelines` | `command.md` | Granular rules for focus rings (`:focus-visible`), form ergonomics, image dimensions (CLS prevention), heading hierarchy, tabular nums, and clickable `file:line` issue formatting. | `PLATFORM GUIDELINE` | Code-level HTML/CSS inspection, anti-pattern checklist, and formatting. |
| **Rendered Evidence & Non-Compensating Gates** | Xialiang98 `design-visual-frontend` | `https://github.com/Xialiang98/design-visual-frontend` | `SKILL.md`<br>`references/review-gates.md` | 5-viewport verification matrix (`390x844` to `2560x1080`), 8 Non-compensating Hard Review Gates (Gates A–H), *Weakest Critical Dimension Rule*, and fallback verification protocol. | `COMMUNITY PRACTICE` | Multi-viewport inspection matrix, hard gates, and browser evidence logging. |
| **Design Intelligence & Platform Tokens** | NextLevelBuilder `ui-ux-pro-max-skill` | `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` | `.claude/skills/ui-ux-pro-max/SKILL.md`<br>`references/quick-reference.md` | Priority 1→10 rule hierarchy (Accessibility & Touch → Data/Charts), WCAG 2.2 AA criteria (*Focus Not Obscured*, *Target Size*), list virtualization (>50 items), and platform norms. | `PLATFORM GUIDELINE` / `ESTABLISHED STANDARD` | Priority hierarchy, accessibility criteria, and collection virtualization. |
| **Quantitative HCI Laws & Heuristics** | overseek944 `frontend-ui-ux-skill` | `https://github.com/overseek944/frontend-ui-ux-skill` | `SKILL.md`<br>`references/quick-reference.md` | Nielsen's 10 Usability Heuristics, quantitative laws (*Fitts's Law*, *Hick's Law*, *Miller's Law*, *Jakob's Law*, *Peak-End Rule*), 5-discipline model, and 10-point Definition-of-Done. | `RESEARCH / HCI PRINCIPLE` | Usability heuristics, cognitive load budgeting, and ergonomic touch targets. |
| **Web Accessibility Standards** | W3C WCAG 2.2 | `https://www.w3.org/TR/WCAG22/` | WCAG 2.2 Specification | Contrast minimum (4.5:1 / 3:1), Focus Appearance (SC 2.4.13), Focus Not Obscured (SC 2.4.11/12), Target Size Minimum (SC 2.5.8), Dragging Movements (SC 2.5.7). | `ESTABLISHED STANDARD` | Non-negotiable accessibility compliance criteria. |
| **Kura Design System Tokens** | Kura Codebase | `src/web/styles/tokens.css` | `src/web/styles/tokens.css` | Multi-theme palette (Sumi Charcoal, Cinema Amber, AMOLED), 8pt spatial grid, concentric border radius, and GPU motion timing curves. | `PROJECT-SPECIFIC DECISION` | Baseline tokens and visual system compliance. |

---

## 2. Authority Levels & Hierarchy

Rules are applied in strict order of authority:
1. `ESTABLISHED STANDARD` (W3C WCAG 2.2, Core Web Vitals) - Non-negotiable legal/technical baselines.
2. `RESEARCH / HCI PRINCIPLE` (Nielsen Norman Group, Fitts, Hick, Miller) - Human cognition and motor movement models.
3. `PLATFORM GUIDELINE` (Apple HIG, Google Material Design 3, Vercel Guidelines) - Platform idioms and ergonomics.
4. `PROJECT-SPECIFIC DECISION` (Kura Tokens in `tokens.css`) - Kura dark theme and brand tokens.
5. `COMMUNITY PRACTICE` (Microsoft Pillars, Xialiang98 Gates) - Review governance frameworks.
