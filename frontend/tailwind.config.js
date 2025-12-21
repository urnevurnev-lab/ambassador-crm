/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Tesla/Apple Palette
        'bg-primary': '#F5F5F7', // Dirty Snow
        'bg-card': '#FFFFFF',
        'text-primary': '#1D1D1F',
        'text-secondary': '#86868B',
        'accent': '#007AFF', // Или твой фирменный цвет
        'divider': '#E5E5EA',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'float': '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
      }
    },
  },
  plugins: [],
}