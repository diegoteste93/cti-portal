/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'cti-dark': '#0f172a',
        'cti-blue': '#1e40af',
        'cti-accent': '#3b82f6',
        'cti-red': '#dc2626',
        'cti-amber': '#f59e0b',
        'cti-green': '#16a34a',
      },
    },
  },
  plugins: [],
};
