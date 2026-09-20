import { createApp } from 'vue';
import App from './App.vue';
import './styles/global.css';

const app = createApp(App);
app.mount('#app');

// Register PWA Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

