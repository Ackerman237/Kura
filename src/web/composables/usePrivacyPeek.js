import { ref, onUnmounted } from 'vue';

/**
 * Manages temporary un-blur peek for cards in SFW privacy mode
 */
export function usePrivacyPeek(defaultDuration = 2000) {
  const isPeeking = ref(false);
  let timer = null;

  function triggerPeek(duration = defaultDuration) {
    isPeeking.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      isPeeking.value = false;
      timer = null;
    }, duration);
  }

  function clearPeek() {
    isPeeking.value = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return {
    isPeeking,
    triggerPeek,
    clearPeek,
  };
}
