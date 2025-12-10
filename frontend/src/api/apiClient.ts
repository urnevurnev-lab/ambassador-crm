import axios from 'axios';

// Используем пустой baseURL. Vite/Proxy автоматически перехватит запросы, 
// начинающиеся с /api, и направит их на http://localhost:3000.
const apiClient = axios.create({
    baseURL: '',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
