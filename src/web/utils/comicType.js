/**
 * Centralized Comic Type & Country Flag Metadata
 */
export function getComicTypeMeta(type = '') {
  const t = (type || 'manga').toLowerCase();

  if (t === 'manhwa' || t === 'kr' || t === 'korea') {
    return {
      type: 'manhwa',
      label: 'MANHWA',
      variant: 'info',
      flagSrc: '/assets/flags/kr.svg',
      country: 'Korea Selatan',
      tooltip: 'Manhwa (Korea Selatan)',
    };
  }

  if (t === 'manhua' || t === 'cn' || t === 'china') {
    return {
      type: 'manhua',
      label: 'MANHUA',
      variant: 'warning',
      flagSrc: '/assets/flags/cn.svg',
      country: 'China',
      tooltip: 'Manhua (China)',
    };
  }

  if (t === 'doujin' || t === 'doujinshi') {
    return {
      type: 'doujinshi',
      label: 'DOUJIN',
      variant: 'warning',
      flagSrc: '/assets/flags/jp.svg',
      country: 'Jepang',
      tooltip: 'Doujinshi (Jepang)',
    };
  }

  // Default to Manga (Japan)
  return {
    type: 'manga',
    label: 'MANGA',
    variant: 'accent',
    flagSrc: '/assets/flags/jp.svg',
    country: 'Jepang',
    tooltip: 'Manga (Jepang)',
  };
}
