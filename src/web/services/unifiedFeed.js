/**
 * Unified Feed Service for Multi-Provider Cinema
 * Queries multiple video providers concurrently with Promise.allSettled,
 * deduplicates entries with matching (title + type), and provides
 * a multi-source selector for viewers.
 */

/**
 * Clean & normalize titles for deduplication comparison
 * @param {string} title
 * @returns {string}
 */
export function normalizeTitleForDeduplication(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .replace(/[\[\(\{].*?[\]\)\}]/g, '') // Remove [1080p], (Sub Indo), etc.
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/gi, ' ')
    .trim();
}

/**
 * Merge multiple provider feeds into a unified deduplicated list.
 * @param {Array<{provider: string, fetcher: () => Promise<Array<any>>}>} providerFetchers
 * @param {number} [timeoutMs=8000]
 * @returns {Promise<Array<object>>}
 */
export async function mergeUnifiedFeed(providerFetchers, timeoutMs = 8000) {
  if (!Array.isArray(providerFetchers) || providerFetchers.length === 0) {
    return [];
  }

  // Wrap each fetcher with a timeout signal
  const settledResults = await Promise.allSettled(
    providerFetchers.map(async ({ provider, fetcher }) => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout fetching ${provider}`)), timeoutMs)
      );
      const data = await Promise.race([fetcher(), timeoutPromise]);
      const items = Array.isArray(data) ? data : data?.results || data?.videos || data?.data || [];
      return { provider, items };
    })
  );

  const dedupeMap = new Map();

  for (const res of settledResults) {
    if (res.status !== 'fulfilled' || !Array.isArray(res.value.items)) {
      continue;
    }

    const { provider, items } = res.value;

    for (const item of items) {
      const rawTitle = item.title || item.name || '';
      if (!rawTitle) continue;

      const normTitle = normalizeTitleForDeduplication(rawTitle);
      const type = (item.type || (provider === 'tube' ? 'live_action' : 'anime')).toLowerCase();
      const dedupeKey = `${normTitle}__${type}`;

      const sourceEntry = {
        provider,
        slug: item.slug || item.id || '',
        thumb: item.thumb || item.cover || item.poster || '',
        url: item.url || '',
      };

      if (dedupeMap.has(dedupeKey)) {
        const existing = dedupeMap.get(dedupeKey);
        // Avoid duplicate source for same provider
        if (!existing.sources.some((s) => s.provider === provider)) {
          existing.sources.push(sourceEntry);
        }
      } else {
        dedupeMap.set(dedupeKey, {
          title: rawTitle,
          type,
          thumb: sourceEntry.thumb,
          cover: sourceEntry.thumb,
          slug: sourceEntry.slug,
          provider,
          duration: item.duration || '',
          views: item.views || '',
          rating: item.rating || '',
          sources: [sourceEntry],
        });
      }
    }
  }

  return Array.from(dedupeMap.values());
}
