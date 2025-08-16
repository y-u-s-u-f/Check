/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f8ff',
          100: '#e2f0fe',
          200: '#bddfff',
          300: '#88c3ff',
          400: '#56a5ff',
          500: '#2d89ff',
          600: '#176fe6',
          700: '#0f56b4',
          800: '#0f448a',
          900: '#103a70',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 1px rgb(0 0 0 / 0.04)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

