/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs', './public/**/*.js'],
  theme: {
    extend: {
      colors: {
        brand: '#1A2238',
        accent: '#D4AF37',
        bg: '#F7F7FA',
        text: '#1f2937',
      },
      borderRadius: { '2xl': '1rem' },
    },
  },
  plugins: [],
};
