/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                surface: '#FFFFFF',
                bgios: '#F2F3F7',
                textPrimary: '#1C1C1E',
                textSecondary: '#8E8E93',
                accent: '#4F46E5',
            },
            boxShadow: {
                soft: '0 10px 40px -10px rgba(0,0,0,0.08)',
                'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)',
            },
        },
    },
    plugins: [],
}
