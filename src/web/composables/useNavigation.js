import { ref, onMounted, onUnmounted } from 'vue';

export function useNavigation(callbacks = {}) {
  // 'manga-home' | 'manga-catalog' | 'manga-detail' | 'manga-reader' | 'video-home' | 'video-watch' | 'library' | 'settings' | 'about'
  const activeScreen = ref('manga-home');
  const currentTab = ref('manga'); // 'manga' | 'catalog' | 'video' | 'library' | 'settings' | 'about'

  function navigateHistory(screen, payload = {}) {
    try {
      const url = new URL(window.location.href);
      if (screen === 'manga-home') {
        url.searchParams.set('tab', 'manga');
        url.searchParams.delete('view');
        url.searchParams.delete('slug');
        url.searchParams.delete('chapter');
      } else if (screen === 'manga-catalog') {
        url.searchParams.set('tab', 'catalog');
        url.searchParams.delete('view');
        url.searchParams.delete('slug');
        url.searchParams.delete('chapter');
      } else if (screen === 'manga-detail') {
        url.searchParams.set('tab', 'manga');
        url.searchParams.set('view', 'manga-detail');
        if (payload.slug) url.searchParams.set('slug', payload.slug);
        url.searchParams.delete('chapter');
      } else if (screen === 'manga-reader') {
        url.searchParams.set('tab', 'manga');
        url.searchParams.set('view', 'reader');
        if (payload.mangaSlug) url.searchParams.set('slug', payload.mangaSlug);
        if (payload.chapterId) url.searchParams.set('chapter', payload.chapterId);
      } else if (screen === 'video-home') {
        url.searchParams.set('tab', 'video');
        url.searchParams.delete('view');
        url.searchParams.delete('slug');
        url.searchParams.delete('chapter');
      } else if (screen === 'video-watch') {
        url.searchParams.set('tab', 'video');
        url.searchParams.set('view', 'video-watch');
        if (payload.slug) url.searchParams.set('slug', payload.slug);
        url.searchParams.delete('chapter');
      } else if (screen === 'library') {
        url.searchParams.set('tab', 'library');
        url.searchParams.delete('view');
        url.searchParams.delete('slug');
        url.searchParams.delete('chapter');
      } else if (screen === 'settings') {
        url.searchParams.set('tab', 'settings');
        url.searchParams.delete('view');
        url.searchParams.delete('slug');
        url.searchParams.delete('chapter');
      } else if (screen === 'about') {
        url.searchParams.set('tab', 'about');
        url.searchParams.delete('view');
        url.searchParams.delete('slug');
        url.searchParams.delete('chapter');
      }
      history.pushState({ screen, ...payload }, '', url.toString());
    } catch (_) {}
  }

  function handleNavigate(tab) {
    currentTab.value = tab;
    if (tab === 'manga') {
      activeScreen.value = 'manga-home';
      navigateHistory('manga-home');
      if (callbacks.onNavigateManga) callbacks.onNavigateManga();
    } else if (tab === 'catalog' || tab === 'manga-catalog') {
      currentTab.value = 'catalog';
      activeScreen.value = 'manga-catalog';
      navigateHistory('manga-catalog');
    } else if (tab === 'video') {
      activeScreen.value = 'video-home';
      navigateHistory('video-home');
      if (callbacks.onNavigateVideo) callbacks.onNavigateVideo();
    } else if (tab === 'library') {
      activeScreen.value = 'library';
      navigateHistory('library');
    } else if (tab === 'settings') {
      activeScreen.value = 'settings';
      navigateHistory('settings');
    } else if (tab === 'about') {
      activeScreen.value = 'about';
      navigateHistory('about');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handlePopState = (e) => {
    const state = e.state;
    if (!state || state.screen === 'manga-home') {
      currentTab.value = 'manga';
      activeScreen.value = 'manga-home';
      if (callbacks.onPopState) callbacks.onPopState('manga-home', state);
    } else if (state.screen === 'manga-catalog') {
      currentTab.value = 'catalog';
      activeScreen.value = 'manga-catalog';
      if (callbacks.onPopState) callbacks.onPopState('manga-catalog', state);
    } else if (state.screen === 'video-home') {
      currentTab.value = 'video';
      activeScreen.value = 'video-home';
      if (callbacks.onPopState) callbacks.onPopState('video-home', state);
    } else if (state.screen === 'manga-detail') {
      currentTab.value = 'manga';
      activeScreen.value = 'manga-detail';
      if (callbacks.onPopState) callbacks.onPopState('manga-detail', state);
    } else if (state.screen === 'video-watch') {
      currentTab.value = 'video';
      activeScreen.value = 'video-watch';
      if (callbacks.onPopState) callbacks.onPopState('video-watch', state);
    } else if (state.screen === 'manga-reader') {
      currentTab.value = 'manga';
      activeScreen.value = 'manga-reader';
      if (callbacks.onPopState) callbacks.onPopState('manga-reader', state);
    } else if (state.screen === 'library') {
      currentTab.value = 'library';
      activeScreen.value = 'library';
    } else if (state.screen === 'settings') {
      currentTab.value = 'settings';
      activeScreen.value = 'settings';
    } else if (state.screen === 'about') {
      currentTab.value = 'about';
      activeScreen.value = 'about';
    }
  };

  onMounted(() => {
    window.addEventListener('popstate', handlePopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState);
  });

  return {
    activeScreen,
    currentTab,
    navigateHistory,
    handleNavigate,
  };
}
