<template>
  <div class="about-hero-card">
    <div class="brand-crest-wrap">
      <div class="kanji-symbol">蔵</div>
      <div class="crest-lines"></div>
    </div>

    <div class="hero-text-block">
      <div class="meta-tag-strip">
        <span class="edition-pill">EDISI MANDIRI (SELF-HOSTED)</span>
        <span class="version-pill">v1.0.0-PRO</span>
      </div>
      <h1 class="about-title">Kura (蔵) — Media Storehouse</h1>
      <p class="about-tagline">
        Gudang media pribadi berkinerja tinggi yang menggabungkan pembaca komik interaktif dan pemutar video serial tanpa iklan komersial, popunder, ataupun pelacakan data pihak ketiga.
      </p>
    </div>
  </div>
</template>

<style scoped>
.about-hero-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 28px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-lg, 12px);
  padding: 32px;
  overflow: hidden;
  box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.6);
}

.brand-crest-wrap {
  position: relative;
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(229, 169, 60, 0.2) 0%, rgba(20, 21, 26, 0.95) 100%);
  border: 1px solid rgba(229, 169, 60, 0.4);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(229, 169, 60, 0.15);
}

.kanji-symbol {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 3rem;
  font-weight: 900;
  color: var(--kura-accent, #e5a93c);
  line-height: 1;
}

.hero-text-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.meta-tag-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.edition-pill {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--kura-accent, #e5a93c);
  background: rgba(229, 169, 60, 0.12);
  border: 1px solid rgba(229, 169, 60, 0.3);
  padding: 2px 8px;
  border-radius: var(--radius-pill, 9999px);
  letter-spacing: 0.04em;
}

.version-pill {
  font-family: var(--kura-font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 2px 8px;
  border-radius: var(--radius-pill, 9999px);
}

.about-title {
  font-family: var(--kura-font-heading, sans-serif);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--kura-text-primary, #ffffff);
  margin: 0;
}

.about-tagline {
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--kura-text-muted, #94a3b8);
  margin: 0;
  max-width: 720px;
}

@media (max-width: 640px) {
  .about-hero-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }
}
</style>
