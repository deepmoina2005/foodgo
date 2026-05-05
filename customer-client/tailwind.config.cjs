/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.12)',
      },
      colors: {
        brand: {
          50: '#fff8ed',
          100: '#ffefcc',
          200: '#ffd992',
          300: '#ffc35a',
          400: '#ffab25',
          500: '#f58c00',
          600: '#d87400',
          700: '#ad5802',
          800: '#8a4508',
          900: '#723808',
        },
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.18), transparent 24%), radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.12), transparent 22%), linear-gradient(135deg, #0f172a 0%, #1f2937 50%, #111827 100%)',
      },
    },
  },
  plugins: [],
};