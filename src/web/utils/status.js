/**
 * Centralized status normalization for catalogue and detail views.
 * Keeps provider-specific raw values but renders canonical labels.
 */

const STATUS_ALIASES = {
  ongoing: [
    'ongoing', 'berjalan', 'publishing', 'airing', 'continuing', 'running',
    'serial', 'publishing ongoing', 'on going'
  ],
  completed: ['completed', 'tamat', 'finished', 'ended', 'complete'],
  hiatus: ['hiatus', 'on hold', 'paused', 'pause', 'on-hold'],
  cancelled: ['cancelled', 'canceled', 'discontinued', 'dropped', 'cancelled / dropped'],
};

export function normalizeStatus(rawValue) {
  if (rawValue === null || rawValue === undefined) return 'Unknown';

  const value = String(rawValue).trim();
  if (!value) return 'Unknown';

  const normalized = value
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (STATUS_ALIASES.ongoing.includes(normalized) || /(?:berjalan|ongoing|publishing|airing|continuing|running)/.test(normalized)) {
    return 'Ongoing';
  }

  if (STATUS_ALIASES.completed.includes(normalized) || /(?:complete|completed|tamat|finished|ended)/.test(normalized)) {
    return 'Completed';
  }

  if (STATUS_ALIASES.hiatus.includes(normalized) || /(?:hiatus|on hold|paused|pause)/.test(normalized)) {
    return 'Hiatus';
  }

  if (STATUS_ALIASES.cancelled.includes(normalized) || /(?:cancelled|canceled|discontinued|dropped)/.test(normalized)) {
    return 'Cancelled';
  }

  return 'Unknown';
}

export function normalizeStatusLabel(rawValue) {
  return normalizeStatus(rawValue);
}

export function normalizeStatusClass(rawValue) {
  return normalizeStatus(rawValue).toLowerCase();
}
