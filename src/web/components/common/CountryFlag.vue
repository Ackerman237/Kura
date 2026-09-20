<script setup>
import { computed } from 'vue';
import { getComicTypeMeta } from '../../utils/comicType.js';

const props = defineProps({
  type: {
    type: String,
    default: 'manga',
  },
  country: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'xs', // 'xs' | 'sm' | 'md' | 'lg'
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
});

const flagMeta = computed(() => {
  const meta = getComicTypeMeta(props.country || props.type);
  return {
    src: meta.flagSrc,
    country: meta.country,
    typeLabel: meta.label,
    tooltip: meta.tooltip,
  };
});
</script>

<template>
  <span
    v-if="flagMeta"
    class="kura-country-flag"
    :class="[`flag-size-${size}`]"
    :title="flagMeta.tooltip"
    aria-label="Bendera Negara Asal"
  >
    <img
      :src="flagMeta.src"
      :alt="flagMeta.country"
      class="flag-img"
      loading="lazy"
      decoding="async"
    />
    <span v-if="showLabel" class="flag-label">{{ flagMeta.typeLabel }}</span>
  </span>
</template>

<style scoped>
.kura-country-flag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  vertical-align: middle;
  line-height: 1;
  flex-shrink: 0;
  user-select: none;
}

.flag-img {
  display: block;
  object-fit: cover;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* Sizes */
.flag-size-xs .flag-img {
  width: 14px;
  height: 10px;
}

.flag-size-sm .flag-img {
  width: 17px;
  height: 12px;
}

.flag-size-md .flag-img {
  width: 20px;
  height: 14px;
  border-radius: 3px;
}

.flag-size-lg .flag-img {
  width: 24px;
  height: 17px;
  border-radius: 3px;
}

.flag-label {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--kura-text-muted, #94a3b8);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
