/**
 * Hooks-free global toast trigger utility
 */
export const toast = {
  success: (message) => {
    window.dispatchEvent(new CustomEvent('toast-alert', { detail: { type: 'success', message } }));
  },
  error: (message) => {
    window.dispatchEvent(new CustomEvent('toast-alert', { detail: { type: 'error', message } }));
  },
  warning: (message) => {
    window.dispatchEvent(new CustomEvent('toast-alert', { detail: { type: 'warning', message } }));
  }
};
export default toast;
