import axios from 'axios';
import WebApp from '@twa-dev/sdk';

// Используем пустой baseURL. Vite/Proxy автоматически перехватит запросы, 
// начинающиеся с /api, и направит их на http://localhost:3000.
const apiClient = axios.create({
    baseURL: '',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    if (WebApp.initData) {
        config.headers.Authorization = `tma ${WebApp.initData}`;
    }
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const url = config.url || '';
    if (adminToken && url.includes('/api/admin')) {
        config.headers['x-admin-token'] = adminToken;
    }
    return config;
});

export default apiClient;
