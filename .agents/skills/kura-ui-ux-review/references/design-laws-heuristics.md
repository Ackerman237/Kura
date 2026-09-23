# Design Laws & Usability Heuristics

This reference details the established human-computer interaction (HCI) laws, cognitive psychology principles, and usability heuristics that govern the audit.

*Primary sources: overseek944 `frontend-ui-ux-skill`, NextLevelBuilder `ui-ux-pro-max-skill`, Nielsen Norman Group.*

---

## 1. Nielsen's 10 Usability Heuristics (Applied to Content-Heavy Web Apps)

| Heuristic | Review Check & Requirement | Kura Specific Application |
|---|---|---|
| **1. Visibility of System Status** | System must provide immediate visual feedback (<100ms) for every action. | Reader loading progress bar, video buffer spinner, source provider switching status, download progress indicator. |
| **2. Match Between System & Real World** | Copy and icons must use familiar reader/viewer terminology, not internal API or database keys. | "Chapter 12", "Episode 4", "Volume 1", "Grid View" rather than `ch_id_8172` or raw provider slugs. |
| **3. User Control & Freedom** | Every multi-step, modal, or overlay view must provide a visible escape route (cancel, close, back, Esc key). | Modal escape button, back button from reader/player restoring previous catalog scroll position, swipe-down to dismiss on mobile dock/sheets. |
| **4. Consistency & Standards** | Platform and design system conventions must be maintained consistently across all pages. | Standard bookmark icon, search bar position, drawer toggle, and unified Kura color tokens. |
| **5. Error Prevention** | Restrict invalid states before submission rather than reporting failures after the fact. | Filter validation (disabling incompatible tag combinations), preventing empty search query execution. |
| **6. Recognition Over Recall** | Make options, filters, and active states visible rather than requiring memory across views. | Active filter tags displayed as removable chips; history rail showing previously read chapters. |
| **7. Flexibility & Efficiency of Use** | Support keyboard shortcuts and power-user paths alongside simple pointer controls. | Arrow keys / `J`/`K` for reader page turns; `Space` for video play/pause; `F` for fullscreen; `Cmd/Ctrl+K` for search palette. |
| **8. Aesthetic & Minimalist Design** | Eliminate irrelevant or rarely needed elements to maximize focus on primary content. | Reader view and video player must offer "lights off / distraction-free" mode hiding secondary toolbars. |
| **9. Help Users Recognize & Recover from Errors** | Error states must clearly explain what went wrong and provide an actionable fix button. | "Provider timed out. [Retry Connection] or [Switch Provider]" instead of raw `504 Gateway Timeout`. |
| **10. Help & Documentation** | Interface must be self-explanatory with progressive disclosure for advanced reader settings. | Short tooltips on reader mode toggles (e.g. "Webtoon / Continuous Vertical", "Double Page Spread", "Right-to-Left Manga"). |

---

## 2. Quantitative HCI Laws

### Fitts's Law (Fitts, 1954)
$$\text{MT} = a + b \log_2\left(1 + \frac{2D}{W}\right)$$
- **Touch Target Dimensions**:
  - Minimum touch target: **44×44pt (iOS HIG) / 48×48dp (Material)**.
  - Absolute legal accessibility floor: **24×24 CSS px** (WCAG 2.2 SC 2.5.8).
  - Target spacing: Minimum **8px** gap between adjacent interactive targets to prevent mis-taps.
- **Destructive Action Separation**:
  - Keep destructive actions ("Clear History", "Delete Download", "Remove All Bookmarks") spatially separated from primary actions.

### Hick's Law (Hick 1952 / Hyman 1953)
$$T = b \log_2(n + 1)$$
- *Cognitive Principle*: Decision time increases logarithmically with the number and complexity of choices.
- *Platform Navigation Norms (Apple HIG / Material Design 3)*:
  - Top-level navigation items should ideally stay within **~7 items**; bottom navigation dock is constrained to **3–5 primary destinations**.
  - Use progressive disclosure for complex filter matrices rather than displaying all tags simultaneously.
  - Maintain **1 prominent primary action** per view; secondary actions must be visually subordinated.

### Miller's Law (Miller, 1956)
- Working memory holds $7 \pm 2$ chunks of information.
- **Rules**:
  - Group dense manga metadata into digestible visual clusters of 3–5 items (e.g., Cluster 1: Authors/Artists; Cluster 2: Status/Release; Cluster 3: Genre Tags).
  - Chunk chapter lists into logical blocks (volumes or groups of 25/50 chapters) with search/jump-to input.

### Jakob's Law (Nielsen, 2000)
- Users spend most of their time on other media sites; adhere to web-wide conventions:
  - Magnifying glass = Search
  - Bookmark / Star = Save
  - Cog / Sliders = Settings
  - `Spacebar` / `K` = Video Play/Pause
  - `Left` / `Right` Arrow = Page flip or 5s seek
  - `Esc` = Close modal or exit reader overlay

### Peak-End Rule (Kahneman, 1999)
- Users judge experiences by their peak intensity and final/ending states.
- **Application**:
  - Empty states (e.g., "No Bookmarks Yet") must include rich recommendations and quick discovery links.
  - End-of-Chapter transition must smoothly offer "Next Chapter", "Related Series", and "Back to Catalog".

---

## 3. Cognitive Load Budgeting

- **Single Job Per Screen**:
  - Catalog: Fast visual scanning & search.
  - Detail: Evaluation of synopsis, tags, and chapter selection.
  - Reader: Zero-distraction immersive reading.
  - Video Player: Cinematic playback and episode navigation.
- **Redundant Information Removal**:
  - Strip redundant badges (e.g., displaying "Manga" badge on every item in a view already filtered to Manga).
  - Balance visual density: high density for chapter lists, breathable spacing for cover grids.
