/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#1a56db',
          700: '#1e40af',
          800: '#1e3a8a',
        },
        ddd:  '#0EA5E9',
        aftu: '#F97316',
        ter:  '#8B5CF6',
      },
    },
  },
  plugins: [],
};
