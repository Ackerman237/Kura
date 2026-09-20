import { PLACEHOLDERS, resolveProxyUrl } from '../utils/media.js';

/**
 * Resilient image error fallback composable
 * 1. If image failed directly from upstream URL, automatically retries via local /api/image-proxy
 * 2. If proxy also fails or already proxied, switches src to standard Kura placeholder SVG
 */
export function useImageFallback() {
  function handleImageError(event, fallbackType = 'cover') {
    const imgEl = event.target;
    if (!imgEl) return;

    const currentSrc = imgEl.src || '';
    const fallbackSrc =
      fallbackType === 'thumbnail'
        ? PLACEHOLDERS.THUMBNAIL
        : fallbackType === 'page'
        ? PLACEHOLDERS.PAGE
        : PLACEHOLDERS.COVER;

    // Avoid infinite loop if placeholder itself fails
    if (currentSrc.includes('/assets/placeholders/')) {
      return;
    }

    // If upstream direct link failed, attempt local proxy once
    if (currentSrc.startsWith('http') && !currentSrc.includes('/api/image-proxy')) {
      imgEl.src = resolveProxyUrl(currentSrc);
      return;
    }

    // Otherwise, assign clear Kura placeholder SVG
    imgEl.src = fallbackSrc;
    imgEl.style.opacity = '1';
  }

  return {
    handleImageError,
  };
}
