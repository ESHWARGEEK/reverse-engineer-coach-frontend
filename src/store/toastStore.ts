import { create } from 'zustand';
import { Toast, ToastType } from '../components/ui/Toast';

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  
  // Convenience methods
  showSuccess: (title: string, message?: string, options?: Partial<Toast>) => string;
  showError: (title: string, message?: string, options?: Partial<Toast>) => string;
  showWarning: (title: string, message?: string, options?: Partial<Toast>) => string;
  showInfo: (title: string, message?: string, options?: Partial<Toast>) => string;
}

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },

  showSuccess: (title, message, options = {}) => {
    return get().addToast({
      type: 'success',
      title,
      message,
      ...options,
    });
  },

  showError: (title, message, options = {}) => {
    return get().addToast({
      type: 'error',
      title,
      message,
      duration: 8000, // Errors stay longer
      ...options,
    });
  },

  showWarning: (title, message, options = {}) => {
    return get().addToast({
      type: 'warning',
      title,
      message,
      duration: 6000,
      ...options,
    });
  },

  showInfo: (title, message, options = {}) => {
    return get().addToast({
      type: 'info',
      title,
      message,
      ...options,
    });
  },
}));

// Hook for easy access to toast functions
export const useToast = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToastStore();
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};