declare global {
  interface Window {
    __env?: { apiUrl?: string; apiKey?: string };
  }
}

export const environment = {
  production: true,
  get apiUrl(): string {
    return window.__env?.apiUrl ?? '';
  },
  get apiKey(): string {
    return window.__env?.apiKey ?? '';
  },
};
