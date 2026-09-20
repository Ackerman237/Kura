<script setup>
import { ArrowLeft } from 'lucide-vue-next';
import AboutHeroCrest from '../components/about/AboutHeroCrest.vue';
import AboutArchitectureCards from '../components/about/AboutArchitectureCards.vue';
import AboutDiagnosticsMonitor from '../components/about/AboutDiagnosticsMonitor.vue';
import AboutShortcutTable from '../components/about/AboutShortcutTable.vue';

const emit = defineEmits(['navigate']);
</script>

<template>
  <div class="kura-about-view container">
    <!-- Back Sub-Nav -->
    <div class="about-subnav">
      <button type="button" class="back-btn" @click="emit('navigate', 'manga')">
        <ArrowLeft :size="16" />
        <span>Kembali ke Beranda</span>
      </button>
    </div>

    <!-- 1. Hero Brand Crest & Manifesto -->
    <AboutHeroCrest />

    <!-- 2. Core Architecture Pillars -->
    <AboutArchitectureCards />

    <!-- 3. Real-Time Client Diagnostics Monitor -->
    <AboutDiagnosticsMonitor />

    <!-- 4. Keyboard Navigation Shortcuts -->
    <AboutShortcutTable />
  </div>
</template>

<style scoped>
.kura-about-view {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-top: 16px;
  padding-bottom: 56px;
}

.about-subnav {
  display: flex;
  align-items: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--kura-text-muted, #94a3b8);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: var(--kura-accent, #e5a93c);
  transform: translateX(-3px);
}
</style>
