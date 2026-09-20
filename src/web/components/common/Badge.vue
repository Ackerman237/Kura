<script setup>
defineProps({
  variant: {
    type: String,
    default: 'neutral', // 'accent' | 'warning' | 'success' | 'info' | 'neutral' | 'outline' | 'type'
  },
  size: {
    type: String,
    default: 'sm', // 'xs' | 'sm' | 'md'
  },
  pill: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <span
    class="kura-badge"
    :class="[
      `badge-${variant}`,
      `size-${size}`,
      { 'is-pill': pill }
    ]"
  >
    <slot />
  </span>
</template>

<style scoped>
.kura-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--kura-font-sans);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border-radius: var(--radius-xs);
  transition: all var(--duration-fast) var(--ease-out);
  user-select: none;
  white-space: nowrap;
}

.is-pill {
  border-radius: var(--radius-pill);
}

/* Sizing */
.size-xs {
  font-size: 0.625rem; /* 10px */
  padding: 2px 6px;
}

.size-sm {
  font-size: 0.6875rem; /* 11px */
  padding: 3px 8px;
}

.size-md {
  font-size: 0.75rem; /* 12px */
  padding: 4px 10px;
}

/* Variants */
.badge-accent {
  background: var(--kura-accent);
  color: var(--kura-text-inverse, #0c0d10);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.badge-success {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-info {
  background: rgba(56, 189, 248, 0.18);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.badge-neutral {
  background: rgba(255, 255, 255, 0.08);
  color: var(--kura-text-primary);
  border: 1px solid var(--kura-border-subtle);
}

.badge-outline {
  background: transparent;
  color: var(--kura-text-muted);
  border: 1px solid var(--kura-border-strong);
}

.badge-type {
  background: rgba(0, 0, 0, 0.7);
  color: var(--kura-text-primary);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: var(--shadow-sm);
}
</style>
