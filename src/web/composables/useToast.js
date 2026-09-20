import { ref } from 'vue';

// Global singleton toast state
const toasts = ref([]);
let toastIdCounter = 0;

export function useToast() {
  function show({ message, type = 'info', duration = 3500, title = '' }) {
    const id = ++toastIdCounter;
    const toast = {
      id,
      message,
      type, // 'success' | 'error' | 'warning' | 'info'
      title,
      duration,
    };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  }

  function dismiss(id) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx >= 0) {
      toasts.value.splice(idx, 1);
    }
  }

  function clearAll() {
    toasts.value = [];
  }

  const success = (message, title = 'Berhasil') => show({ message, type: 'success', title });
  const error = (message, title = 'Terjadi Kesalahan') => show({ message, type: 'error', duration: 4500, title });
  const warning = (message, title = 'Perhatian') => show({ message, type: 'warning', title });
  const info = (message, title = 'Informasi') => show({ message, type: 'info', title });

  return {
    toasts,
    show,
    dismiss,
    clearAll,
    success,
    error,
    warning,
    info,
  };
}
