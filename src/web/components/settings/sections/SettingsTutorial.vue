<script setup>
import { BookOpen } from 'lucide-vue-next';
</script>

<template>
  <section class="settings-card tutorial-card">
    <div class="card-icon-box">
      <BookOpen :size="24" />
    </div>
    <div class="card-content">
      <div class="card-text">
        <h3 class="card-title">Panduan Desain &amp; Tutorial Token Kura</h3>
        <p class="card-desc">Pelajari bagaimana sistem desain token Kura bekerja dan tips memilih palet yang estetik.</p>
      </div>

      <div class="tutorial-accordion">
        <div class="tutorial-step">
          <div class="step-num">1</div>
          <div class="step-body">
            <h5 class="step-title">Prinsip Warna 60-30-10</h5>
            <p class="step-desc">
              Untuk kenyamanan mata saat membaca lama di malam hari, <strong>60%</strong> tampilan menggunakan warna latar gelap (Background), <strong>30%</strong> warna kartu pembaca (Surface), dan <strong>10%</strong> warna aksen kontras tinggi (Accent) seperti Amber Gold, Jade, atau Sakura Pink.
            </p>
          </div>
        </div>

        <div class="tutorial-step">
          <div class="step-num">2</div>
          <div class="step-body">
            <h5 class="step-title">Memilih Warna Background &amp; Surface</h5>
            <p class="step-desc">
              Pastikan warna kartu (Surface) sedikit lebih terang dari warna latar belakang (Background). Misalnya: Jika latar adalah <code>#0E0F12</code>, pilih kartu <code>#17181C</code> agar kedalaman visual terlihat alami (<em>elevation hierarchy</em>).
            </p>
          </div>
        </div>

        <div class="tutorial-step">
          <div class="step-num">3</div>
          <div class="step-body">
            <h5 class="step-title">Dukungan CSS Token Mandiri</h5>
            <p class="step-desc">
              Tema kustom secara otomatis menyuntikkan variabel CSS murni <code>--kura-bg</code>, <code>--kura-surface</code>, dan <code>--kura-accent</code> langsung ke elemen dokumen tanpa perlu kompilasi ulang.
            </p>
          </div>
        </div>

        <div class="tutorial-step">
          <div class="step-num">4</div>
          <div class="step-body">
            <h5 class="step-title">Tips Ekstraktor Gambar</h5>
            <p class="step-desc">
              Gunakan cover komik, wallpaper anime, atau ilustrasi digital dengan kontras tinggi. Algoritma akan menganalisis spektrum warna dan menghasilkan palet harmonis yang menjaga keterbacaan teks.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings-card {
  display: flex; gap: 20px;
  background: var(--kura-surface, #14151a);
  border: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.08));
  border-radius: var(--radius-md, 8px); padding: 24px;
}
.tutorial-card { border-color: rgba(99,102,241,0.25); }
.card-icon-box {
  width: 44px; height: 44px; border-radius: 10px;
  background: rgba(99,102,241,0.1);
  display: flex; align-items: center; justify-content: center;
  color: #818cf8; flex-shrink: 0;
}
.card-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
.card-title { font-family: var(--kura-font-heading, sans-serif); font-size: 1.05rem; font-weight: 700; color: var(--kura-text-primary, #fff); margin: 0; }
.card-desc { font-size: 0.82rem; line-height: 1.5; color: var(--kura-text-muted, #94a3b8); margin: 6px 0 0; }
.tutorial-accordion { display: flex; flex-direction: column; gap: 0; }
.tutorial-step {
  display: flex; gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--kura-border-subtle, rgba(255,255,255,0.06));
}
.tutorial-step:last-child { border-bottom: none; padding-bottom: 0; }
.step-num {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: rgba(129, 140, 248, 0.15);
  border: 1px solid rgba(129, 140, 248, 0.3);
  color: #818cf8; font-size: 0.75rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.step-body { flex: 1; }
.step-title { font-size: 0.88rem; font-weight: 700; color: var(--kura-text-primary, #fff); margin: 0 0 6px; }
.step-desc { font-size: 0.78rem; line-height: 1.6; color: var(--kura-text-muted, #94a3b8); margin: 0; }
.step-desc code {
  font-family: var(--kura-font-mono, monospace);
  background: rgba(255,255,255,0.06);
  padding: 1px 5px; border-radius: 4px; font-size: 0.75rem;
  color: var(--kura-accent, #e5a93c);
}
.step-desc strong { color: var(--kura-text-primary, #fff); }
</style>
