<script setup>
import { Tv } from 'lucide-vue-next';

const props = defineProps({
  currentProvider: {
    type: String,
    default: 'htv',
  },
  providers: {
    type: Array,
    default: () => [
      { id: 'all', label: 'Semua Studio', desc: 'Gabungan Lintas Provider' },
      { id: 'htv', label: 'HentaiTV Studio', desc: 'Sub Indo & Raw Full HD' },
      { id: 'neko', label: 'NekoPoi Studio', desc: 'Arsip Populer Indonesia' },
      { id: 'tube', label: 'Eporner Tube', desc: 'Tube Global 1080p 60FPS' },
    ],
  },
});

const emit = defineEmits(['select-provider']);
</script>

<template>
  <div class="studio-switcher-bar">
    <button
      v-for="p in providers"
      :key="p.id"
      type="button"
      class="studio-tab-card"
      :class="{ active: currentProvider === p.id }"
      @click="emit('select-provider', p.id)"
    >
      <div class="tab-indicator-dot"></div>
      <div class="tab-meta">
        <span class="tab-name">{{ p.label }}</span>
        <span class="tab-desc">{{ p.desc }}</span>
      </div>
    </button>
  </div>
</template>

<style scoped>
/* ── Desktop: grid card ─────────────────────────────────────────── */
.studio-switcher-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (min-width: 960px) {
  .studio-switcher-bar {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
}

.studio-tab-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md, 8px);
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.08));
  cursor: pointer;
  text-align: left;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  white-space: nowrap;
  min-width: 0;
}

.studio-tab-card:hover {
  border-color: rgba(229, 169, 60, 0.4);
  background: rgba(255, 255, 255, 0.04);
}

.studio-tab-card.active {
  background: rgba(229, 169, 60, 0.1);
  border-color: var(--kura-accent, #e5a93c);
}

.tab-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.studio-tab-card.active .tab-indicator-dot {
  background: var(--kura-accent, #e5a93c);
  box-shadow: 0 0 8px var(--kura-accent, #e5a93c);
}

.tab-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tab-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--kura-text-primary, #ffffff);
}

.tab-desc {
  font-size: 0.68rem;
  color: var(--kura-text-muted, #94a3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Mobile: horizontal scrollable pill tabs ────────────────────── */
@media (max-width: 639px) {
  .studio-switcher-bar {
    display: flex;
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
    /* Fade kanan sebagai scroll hint */
    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    mask-image: linear-gradient(to right, black 85%, transparent 100%);
  }
  .studio-switcher-bar::-webkit-scrollbar { display: none; }

  .studio-tab-card {
    flex-shrink: 0;
    flex-direction: row;
    align-items: center;
    gap: 7px;
    padding: 7px 14px;
    border-radius: var(--radius-pill, 9999px);
    height: 36px;
  }

  /* Sembunyikan desc di mobile pill — terlalu ramai */
  .tab-desc {
    display: none;
  }

  .tab-name {
    font-size: 0.78rem;
  }

  .tab-indicator-dot {
    width: 6px;
    height: 6px;
  }
}
</style>
