# Kura Domain-Specific UI/UX Audit Checklist

This checklist applies the referenced human-authored standards directly to the specific surfaces, workflows, and media components of **Kura** (content-heavy manga/video web application).

---

## 1. Content Discovery & Home Catalog (`HomeView.vue`, `MangaCatalogView.vue`, `CinemaHomeView.vue`)

- [ ] **Cover Grid Aspect Ratios & CLS Prevention**:
  - Manga covers maintain consistent `aspect-ratio: 2/3` or `3/4`.
  - Video thumbnails maintain consistent `aspect-ratio: 16/9`.
  - Placeholders (`placeholder-cover.svg`, `placeholder-thumbnail.svg`) render immediately to reserve layout space.
- [ ] **Badge Overlap & Hierarchy**:
  - Status badges (e.g. `Ongoing`, `Completed`, `1080p`, `HD`) do not obscure essential cover artwork or title text.
  - Badges use semi-transparent backdrops (`backdrop-filter: blur()`) with contrast ratio >= 4.5:1 against varying cover colors.
- [ ] **Provider / Source Selection**:
  - Active provider is clearly indicated with high visual contrast.
  - Switching provider provides immediate loading feedback (<100ms) and preserves current sort/filter preferences where possible.
- [ ] **Metadata Density & Typography**:
  - Title strings are constrained to 2 lines max with `-webkit-line-clamp: 2` and tooltip on hover for truncated titles.
  - Chapter count, score, and latest update date use secondary muted token (`--kura-text-muted`) with `tabular-nums`.
- [ ] **Infinite Scroll / Pagination Resilience**:
  - Smooth loading spinner or skeleton grid when fetching subsequent pages.
  - Clear "End of Results" visual indicator when the catalog terminates.

---

## 2. Search & Filter Overlay (`SearchModal.vue`, `FilterDrawer.vue`)

- [ ] **Keyboard Interaction & Shortcuts**:
  - `Cmd+K` or `Ctrl+K` opens the search palette from any screen.
  - Search input automatically gains focus on open (desktop only; avoids mobile virtual keyboard jump).
  - `Esc` immediately dismisses the search palette.
  - Arrow up/down navigates autocomplete results with visible active indicator.
- [ ] **Instant Feedback & Debounce**:
  - Search input debounces network requests (250–350ms) to avoid request flooding and UI stutter.
  - Shows clear loading indicator inside the search bar during query dispatch.
- [ ] **Tag & Filter Matrix**:
  - Genres/Tags use clear multi-select states (selected vs unselected vs excluded).
  - Selected tags display as removable chips with >=44px touch targets on mobile.
  - Clear "Reset Filters" action available when filters are active.

---

## 3. Series Detail & Chapter Selection (`MangaDetailView.vue`)

- [ ] **Visual Hierarchy & Synopsis**:
  - Dominant hero section displays title, author, rating, status, and prominent "Start Reading" or "Continue Ch. X" primary CTA.
  - Long synopsis text provides a progressive disclosure "Read more / Read less" toggle to prevent pushing chapter lists below the fold.
- [ ] **Chapter List Navigation & Filtering**:
  - Supports ascending/descending sort order toggle.
  - Search/filter input within chapter list for quickly locating specific chapter numbers.
  - Read vs unread chapters are clearly distinguished (unread: `--kura-text-primary`; read: `--kura-text-muted` or dimmed badge).
  - Bookmark/download status icons per chapter have accessible `aria-label`s.
- [ ] **Long Chapter List Performance**:
  - Series with 100+ chapters utilize list virtualization or pagination to maintain smooth 60fps scrolling.

---

## 4. Manga Reader Experience (`useReaderEngine.js`, Reader Views)

- [ ] **Reading Focus & Distraction-Free Mode**:
  - Tap/click in center zone toggles immersive mode (hides header, bottom bar, and navigation chrome).
  - Dark background (`#0E0F12` or `#000000` in AMOLED mode) eliminates bright glare during reading.
- [ ] **Reading Modes & Ergonomics**:
  - Supports Webtoon (continuous vertical scroll), Single Page, and Double Page Spread (Left-to-Right / Right-to-Left).
  - Continuous vertical mode maintains image preloading with zero horizontal jitter.
  - Page transitions respond smoothly to swipe gestures and keyboard arrow keys (`Left`/`Right`, `J`/`K`, `Space`/`Shift+Space`).
- [ ] **Page Progress & Jump Scrubbing**:
  - Bottom scrubber bar displays current page / total pages (`tabular-nums`).
  - Scrubber thumb has large hit target (>=44px) for touch dragging.
  - Floating Quick-Menu provides instant access to reader settings, chapter list, and exit.

---

## 5. Video & Cinema Watch Experience (`VideoWatchView.vue`, `CinemaHomeView.vue`)

- [ ] **Player Shell & Controls**:
  - HTML5 video player controls have high contrast against both dark and bright video frames.
  - Keyboard shortcuts (`Space` = Play/Pause, `F` = Fullscreen, `M` = Mute, `Left`/`Right` = 5s seek, `Up`/`Down` = Volume).
- [ ] **Episode Rail & Playlist Sidebar**:
  - Current active episode is prominently highlighted.
  - Episode list scrollable independently without scrolling the main video viewport.
- [ ] **Stream Source Quality Selector**:
  - Clear quality badges (`1080p`, `720p`, `Auto`, `Server 1`, `Server 2`).
  - Graceful buffering spinner and error recovery when stream fails or drops.

---

## 6. Mobile Dock & Responsive Shell (`MobileDock.vue`, `Header.vue`)

- [ ] **Bottom Dock Sizing & Insets**:
  - Height: `--mobile-dock-height: 58px` + `padding-bottom: env(safe-area-inset-bottom)`.
  - Max 5 primary navigation tabs (Hick's Law).
  - Active tab highlighted with accent color (`--kura-accent`) and subtle indicator pill.
- [ ] **Touch Target Safety**:
  - Nav icons and buttons have minimum `44x44px` hit areas and `8px` inter-target spacing.
- [ ] **Sidebar Desktop Behavior**:
  - Collapses to icon rail (`--sidebar-width-collapsed: 68px`) on medium screens.
  - Expands to full navigation (`--sidebar-width-expanded: 240px`) on standard desktop.

---

## 7. Privacy Mode & Specialty Features (`usePrivacyMode.js`, `usePrivacyPeek.js`)

- [ ] **Privacy Blur / Cover Concealment**:
  - When Privacy Mode is active, sensitive covers and titles are blurred or masked by default.
  - Privacy Peek (tap/hover to briefly reveal) provides immediate, smooth transition without layout jump.
- [ ] **Quick Emergency Escape**:
  - Panic key or quick gesture immediately conceals the viewport or navigates to a neutral view.

---

## 8. Theme Consistency & Feedback States

- [ ] **Kura Theme Token Fidelity**:
  - All surfaces strictly use semantic variables: `--kura-bg`, `--kura-surface`, `--kura-surface-hover`, `--kura-accent`, `--kura-text-primary`, `--kura-text-muted`.
  - Tested across all curated presets (Sumi Charcoal, Cinema Amber, AMOLED Pitch Black, Custom themes).
- [ ] **Empty & Error State Actionability**:
  - Empty library / history view provides direct "Explore Catalog" CTA.
  - Scraper failure / offline state provides "Retry Connection" and "View Cached Content" actions.
- [ ] **Toast Notifications**:
  - Auto-dismiss in 3–5 seconds; pause on hover.
  - Rendered in `aria-live="polite"` container; do not steal keyboard focus.
