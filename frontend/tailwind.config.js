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
        },
    },
    plugins: [],
}
