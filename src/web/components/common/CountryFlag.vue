<script setup>
import { computed } from 'vue';

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
  const t = (props.country || props.type || '').toLowerCase();
  if (t === 'manhwa' || t === 'kr' || t === 'korea') {
    return {
      src: '/assets/flags/kr.svg',
      country: 'Korea Selatan',
      typeLabel: 'Manhwa',
      tooltip: 'Manhwa (Korea Selatan)',
    };
  }
  if (t === 'manhua' || t === 'cn' || t === 'china') {
    return {
      src: '/assets/flags/cn.svg',
      country: 'China',
      typeLabel: 'Manhua',
      tooltip: 'Manhua (China)',
    };
  }
  if (t === 'manga' || t === 'doujin' || t === 'doujinshi' || t === 'jp' || t === 'japan') {
    return {
      src: '/assets/flags/jp.svg',
      country: 'Jepang',
      typeLabel: t.includes('doujin') ? 'Doujin' : 'Manga',
      tooltip: `${t.includes('doujin') ? 'Doujin' : 'Manga'} (Jepang)`,
    };
  }
  return null;
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
