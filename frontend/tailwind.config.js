/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sidebar: '#0f172a',
        triage: {
          1: '#dc2626',
          2: '#ea580c',
          3: '#eab308',
          4: '#22c55e',
          5: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
}
