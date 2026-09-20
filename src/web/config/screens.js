/**
 * Screen and Tab Identifiers for Kura App Navigation
 */
export const SCREENS = {
  MANGA_HOME: 'manga-home',
  MANGA_CATALOG: 'manga-catalog',
  MANGA_DETAIL: 'manga-detail',
  MANGA_READER: 'manga-reader',
  VIDEO_HOME: 'video-home',
  VIDEO_WATCH: 'video-watch',
  LIBRARY: 'library',
  SETTINGS: 'settings',
  ABOUT: 'about',
};

export const TABS = {
  MANGA: 'manga',
  CATALOG: 'catalog',
  VIDEO: 'video',
  LIBRARY: 'library',
  SETTINGS: 'settings',
  ABOUT: 'about',
};

/**
 * URL parameter synchronization mapping
 */
export const SCREEN_URL_MAP = {
  [SCREENS.MANGA_HOME]: { tab: TABS.MANGA },
  [SCREENS.MANGA_CATALOG]: { tab: TABS.CATALOG },
  [SCREENS.MANGA_DETAIL]: { tab: TABS.MANGA, view: 'manga-detail', paramKey: 'slug' },
  [SCREENS.MANGA_READER]: { tab: TABS.MANGA, view: 'reader', multiParams: true },
  [SCREENS.VIDEO_HOME]: { tab: TABS.VIDEO },
  [SCREENS.VIDEO_WATCH]: { tab: TABS.VIDEO, view: 'video-watch', paramKey: 'slug' },
  [SCREENS.LIBRARY]: { tab: TABS.LIBRARY },
  [SCREENS.SETTINGS]: { tab: TABS.SETTINGS },
  [SCREENS.ABOUT]: { tab: TABS.ABOUT },
};
