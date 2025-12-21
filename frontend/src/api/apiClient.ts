import axios from 'axios';
import WebApp from '@twa-dev/sdk';

// В dev-режиме Vite/Proxy автоматически перехватит запросы, начинающиеся с /api,
// и направит их на http://localhost:3000 (см. vite.config.ts).
// В проде можно прокинуть URL API через VITE_API_BASE_URL.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

const apiClient = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const initData = (WebApp as unknown as { initData?: string }).initData;
    if (initData) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `tma ${initData}`;
    }
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const url = config.url || '';
    if (adminToken && url.includes('/api/admin')) {
        config.headers = config.headers ?? {};
        config.headers['x-admin-token'] = adminToken;
    }
    return config;
});

export default apiClient;
