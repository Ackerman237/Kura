/**
 * Value formatting utilities for numbers, durations, views, and dates
 */

/**
 * Format view counts (e.g. 1500000 -> 1.5M, 24500 -> 24.5K)
 */
export function formatViews(views) {
  if (views === null || views === undefined || views === '') return '0 tayang';
  const num = typeof views === 'string' ? parseFloat(views.replace(/[^0-9.]/g, '')) : Number(views);
  if (isNaN(num)) return `${views} tayang`;

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M tayang`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K tayang`;
  }
  return `${num} tayang`;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(duration) {
  if (!duration) return '00:00';
  if (typeof duration === 'string' && duration.includes(':')) return duration;

  const sec = parseInt(duration, 10);
  if (isNaN(sec)) return '00:00';

  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Format a number with Indonesian locale standard
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (isNaN(n)) return String(num);
  return new Intl.NumberFormat('id-ID').format(n);
}

/**
 * Format an ISO or raw date string to Indonesian formatted date
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}
