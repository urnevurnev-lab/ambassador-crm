/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
      },
      colors: {
        ios: {
          bg: '#F2F2F7',     // System Gray 6 (Base background)
          card: '#FFFFFF',   // Pure White
          text: '#000000',
          subtext: '#8E8E93', // System Gray
          blue: '#007AFF',    // System Blue
          divider: '#C6C6C8',
        }
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px', // Standard iOS Widget radius
      },
      boxShadow: {
        'ios': '0 2px 8px rgba(0, 0, 0, 0.04)', // Very subtle, clean shadow
        'ios-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}