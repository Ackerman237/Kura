# Kura UI/UX Review Skill

Project-local review skill for auditing the UI/UX quality, accessibility, visual hierarchy, responsiveness, and interaction design of **Kura** (content-heavy manga/video web app).

## Overview
- **Location**: `.agents/skills/kura-ui-ux-review/`
- **Specification**: Aligns with Agent Skills open format (`ravidsrk/agent-skills` & `mblode/agent-skills`).
- **Foundations**: Microsoft `frontend-design-review`, Vercel `web-design-guidelines`, Xialiang98 `design-visual-frontend`, NextLevelBuilder `ui-ux-pro-max-skill`, and overseek944 `frontend-ui-ux-skill`.

## When to Use
Invoke this skill within Antigravity CLI for:
- Auditing manga reader focus and navigation ergonomics
- Inspecting video watch pages, episode rails, and player controls
- Verifying content discovery, cover aspect ratios, and CLS prevention
- Checking WCAG 2.2 AA accessibility, keyboard navigation, and focus rings
- Validating multi-viewport responsive reflow (`390x844` mobile to `2560x1080` ultrawide)
- Verifying Kura dark design token compliance (`src/web/styles/tokens.css`)

## Example Invocations
```text
Run a UI/UX review on the manga reader view using kura-ui-ux-review
```
```text
Audit src/web/views/VideoWatchView.vue against kura-ui-ux-review guidelines
```
```text
Check the accessibility and touch targets of HomeView.vue and MobileDock.vue
```

## Structure
- `SKILL.md` - Core skill manifest, audit workflow, and report template
- `README.md` - Human documentation and usage instructions
- `references/` - Deep dive documentation loaded on demand
  - `sources.md` - Verified sources, exact URLs, and authority mapping
  - `evaluation-framework.md` - 3 Quality Pillars and 8 Non-Compensating Hard Gates
  - `design-laws-heuristics.md` - Nielsen's 10 Heuristics & Quantitative HCI Laws (Fitts, Hick, Miller)
  - `viewport-visual-protocol.md` - 5-viewport matrix (390px to 2560px) & browser inspection protocol
  - `code-level-guidelines.md` - Granular HTML/CSS/DOM rules, focus rings, and anti-patterns
  - `kura-domain-checklist.md` - Manga reader, video player, catalog grids, and Kura dark tokens
  - `source-attribution-conflicts.md` - Upstream source mapping and domain-justified conflict resolution
