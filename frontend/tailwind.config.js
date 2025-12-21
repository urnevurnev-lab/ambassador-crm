/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Пиксельный / Терминальный шрифт (найди потом "Press Start 2P" или "VT323" на Google Fonts для вау-эффекта)
        sans: ['Inter', 'system-ui', 'sans-serif'], // Основной шрифт

      colors: {
        'ios-bg': '#F5F5F7',
        'card': '#FFFFFF',
        'retro': {
          bg: '#000000',
          surface: '#111111',
          border: '#333333',
          text: '#FFFFFF',
          muted: '#888888',
          accent: '#FF3B30',
          success: '#00FF00',
        }
      },
      borderRadius: {
        none: '0', // Все квадратное
        sm: '2px', // Микро-скругление для кнопок
      },
      borderWidth: {
        '3': '3px', // Жирные рамки
      },
      boxShadow: {
        'soft': '0 8px 30px rgb(0, 0, 0, 0.04)',
        'retro': '4px 4px 0 0 #333333', 
        'retro-accent': '4px 4px 0 0 #FF3B30',
        'retro-inset': 'inset 2px 2px 0 0 #000000, inset -2px -2px 0 0 #333333',
      },
    },
  },
  plugins: [],
}