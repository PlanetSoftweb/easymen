/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'card-golden': '#FFD700',
        'card-blue': '#1a365d',
        'app-black': '#111827',
        'app-dark': '#1F2937',
        'app-darker': '#111827'
      },
      ringColor: {
        DEFAULT: '#FFD700',
        'card-golden': '#FFD700'
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(45deg, #121212 0%, #2D2D2D 100%)',
        'golden-gradient': 'linear-gradient(45deg, #FFD700 0%, #FDB813 100%)',
        'blue-gradient': 'linear-gradient(45deg, #1a365d 0%, #2B4C7E 100%)'
      }
    },
  },
  plugins: [],
};