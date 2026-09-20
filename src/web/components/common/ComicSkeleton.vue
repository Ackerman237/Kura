<script setup>
defineProps({
  viewMode: {
    type: String,
    default: 'grid', // 'grid' | 'list'
  },
});
</script>

<template>
  <div class="kura-comic-skeleton" :class="`view-${viewMode}`">
    <div class="skeleton-cover shimmer"></div>
    <div class="skeleton-body">
      <div class="skeleton-line title shimmer"></div>
      <div class="skeleton-line subtitle shimmer"></div>
      <div class="skeleton-footer">
        <div class="skeleton-line tag shimmer"></div>
        <div class="skeleton-line time shimmer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kura-comic-skeleton {
  background: var(--kura-surface);
  border: 1px solid var(--kura-border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.view-grid {
  display: flex;
  flex-direction: column;
}

.view-grid .skeleton-cover {
  width: 100%;
  aspect-ratio: 2 / 3;
}

.view-grid .skeleton-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-list {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  gap: 14px;
}

.view-list .skeleton-cover {
  width: 60px;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}

.view-list .skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: var(--radius-xs);
  background: var(--kura-surface-hover);
}

.skeleton-line.title {
  width: 85%;
  height: 14px;
}

.skeleton-line.subtitle {
  width: 60%;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.skeleton-line.tag {
  width: 50px;
  height: 10px;
}

.skeleton-line.time {
  width: 40px;
  height: 10px;
}

/* Shimmer Effect */
.shimmer {
  position: relative;
  overflow: hidden;
  background: var(--kura-surface-hover);
}

.shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer-anim 1.6s infinite;
}

@keyframes shimmer-anim {
  100% {
    transform: translateX(100%);
  }
}
</style>
