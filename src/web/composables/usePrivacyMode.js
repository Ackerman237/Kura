import { ref, onMounted } from 'vue';

const PRIVACY_KEY = 'kura_privacy_mode';
const PEEK_DURATION_KEY = 'kura_sfw_peek_duration';
const BLUR_INTENSITY_KEY = 'kura_sfw_blur';

export function usePrivacyMode() {
  const isPrivacyMode = ref(false);
  const peekDuration = ref(2000);
  const blurIntensity = ref('12px');

  const togglePrivacyMode = () => {
    isPrivacyMode.value = !isPrivacyMode.value;
    try {
      localStorage.setItem(PRIVACY_KEY, isPrivacyMode.value ? 'true' : 'false');
    } catch (_) {}
  };

  const setPeekDuration = (dur) => {
    peekDuration.value = dur;
    try {
      localStorage.setItem(PEEK_DURATION_KEY, dur.toString());
    } catch (_) {}
  };

  const setBlurIntensity = (intensity) => {
    blurIntensity.value = intensity;
    try {
      localStorage.setItem(BLUR_INTENSITY_KEY, intensity);
      document.documentElement.style.setProperty('--kura-sfw-blur', intensity);
    } catch (_) {}
  };

  onMounted(() => {
    try {
      isPrivacyMode.value = localStorage.getItem(PRIVACY_KEY) === 'true';
      const savedPeek = localStorage.getItem(PEEK_DURATION_KEY);
      if (savedPeek) peekDuration.value = parseInt(savedPeek, 10) || 2000;
      const savedBlur = localStorage.getItem(BLUR_INTENSITY_KEY);
      if (savedBlur) {
        blurIntensity.value = savedBlur;
        document.documentElement.style.setProperty('--kura-sfw-blur', savedBlur);
      }
    } catch (_) {}
  });

  return {
    isPrivacyMode,
    peekDuration,
    blurIntensity,
    togglePrivacyMode,
    setPeekDuration,
    setBlurIntensity,
  };
}
