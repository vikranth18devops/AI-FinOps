// Dynamic API & WebSocket URL resolution for Local Development & Production K8s Ingress
export const getApiBaseUrl = (): string => {
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080';
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export const getWsBaseUrl = (): string => {
  const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
  if (envWsUrl) {
    return envWsUrl;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${protocol}//localhost:8080`;
    }
    return `${protocol}//${window.location.host}`;
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();
