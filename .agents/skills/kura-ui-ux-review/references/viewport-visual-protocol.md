# Viewport Matrix & Visual Browser Verification Protocol

This document defines the strict multi-viewport rendering verification protocol and the fallback procedure when browser automation is unavailable.

*Primary sources: Xialiang98 `design-visual-frontend`, Microsoft `frontend-design-review`.*

---

## 1. Required Viewport Verification Matrix

When browser automation or visual inspection tools are available, review the rendered interface across all five standard viewports:

| Viewport Size | Device Profile | Mandatory Audit Checks |
|---|---|---|
| **`390 x 844`** | Mobile Portrait (iPhone 14 / standard smartphone) | - Mobile bottom dock visibility and safe-area padding (`env(safe-area-inset-bottom)`).<br>- Touch target sizes (>=44x44px).<br>- Horizontal overflow check (`body` must never scroll horizontally).<br>- Floating action button / reader control thumb reachability.<br>- Cover grid reflow (typically 2-3 columns max). |
| **`768 x 1024`** | Tablet Portrait (iPad / medium surface) | - Breakpoint transition smoothness.<br>- Navigation drawer / sidebar collapse or slide-out state.<br>- Modal width and sheet transformation.<br>- 3-4 column grid reflow. |
| **`1440 x 900`** | Standard Laptop / Desktop | - Standard sidebar expansion (`--sidebar-width-expanded: 240px`).<br>- Multi-column catalog layout (5-6 column cover grid).<br>- Reader double-page spread mode framing.<br>- Header search input visibility. |
| **`1920 x 1080`** | Full HD Desktop Monitor | - Maximum content container width constraint (`--max-content-width: 1360px`).<br>- Space utilization in wide layout.<br>- Video player aspect ratio and sidebar rail proportions. |
| **`2560 x 1080`** | Ultrawide / Cinematic Monitor | - **MANDATORY for media/cinema apps**.<br>- Verify fixed panels are not stranded in giant empty oceans.<br>- Verify background atmosphere and full-bleed reader modes scale correctly without stretching image assets. |

> [!IMPORTANT]
> The `2560x1080` check cannot be replaced by a `1440px` inspection. Ultrawide layout breaks (such as centered modals becoming pinpricks or sidebars becoming detached) only appear at widescreen scales.

---

## 2. Browser Verification Procedure (When Browser Automation is Available)

1. **Launch & Serve**:
   - Start the local dev server (`npm run dev:web` or `node server.js`).
   - Navigate to the target route (e.g. `http://localhost:5173`).
2. **Viewport Stepping**:
   - Set browser viewport to each target resolution with `deviceScaleFactor: 1`.
   - Wait for web fonts (`Outfit`, `Plus Jakarta Sans`, `JetBrains Mono`), cover images, and DOM state to fully paint.
3. **Capture Evidence**:
   - Capture full-page and above-the-fold viewport screenshots.
4. **DOM & State Inspection**:
   - Inspect computed styles for hardcoded pixel/color values.
   - Test tab order with keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Esc`).
   - Verify focus indicator visibility on active elements.
   - Check browser console for JavaScript errors, failed network requests, and hydration warnings.
5. **Interactive Flow Audit**:
   - Trigger interactive states: Hover, Active, Focus, Loading, Empty, and Error states.
   - Open reader mode: test page flipping, fullscreen toggle, reader setting sheet.
   - Open video watch mode: test player controls, episode rail selection, theater mode.
6. **Record Evidence Log**:
   - For every visual discrepancy, log:
     $$\text{Observation} \longrightarrow \text{Root Cause} \longrightarrow \text{Structural Treatment} \longrightarrow \text{Recheck Viewport}$$

---

## 3. Fallback Protocol (When Browser Automation is Unavailable)

If no browser automation, MCP browser tool, or screenshot tool is active in the environment:

1. **Explicit Statement of Limitation**:
   - Explicitly disclose at the top of the audit:
     > `[!NOTE]`
     > **Visual Verification Notice**: Browser automation was unavailable in this session. All findings are derived from static source code, CSS token analysis, component template structure, and AST inspection. Rendered visual proof (screenshots, layout shifts, pixel-perfect rendering) requires manual verification.

2. **Manual Viewport Verification Checklist**:
   - Provide the user with a concise, ready-to-test manual verification checklist mapped to the five viewports.
   - Highlight the specific code locations most vulnerable to layout failure (e.g., flex children without `min-w-0`, fixed pixel widths, missing `safe-area-inset` padding).
3. **Strict Ban on Fabricated Visual Logs**:
   - **Never** invent fake screenshot descriptions, fake pixel measurements, or simulated render artifacts.
