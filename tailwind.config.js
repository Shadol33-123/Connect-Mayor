/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
          'rank-hierro': '#6b7280',
          'rank-bronce': '#b87333',
          'rank-plata': '#c0c0c0',
          'rank-oro': '#ffd700',
          'brand-green': '#58cc02',
          'brand-green-dark': '#46a302',
          'brand-yellow': '#ffc800'
      },
        borderRadius: {
          xl: '1.25rem'
        }
    },
  },
  plugins: [],
};
