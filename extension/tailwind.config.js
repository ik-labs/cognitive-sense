/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./panel.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Risk levels
        safe: {
          bg: '#ecfdf5',
          border: '#10b981',
          text: '#065f46'
        },
        caution: {
          bg: '#fef3c7',
          border: '#f59e0b',
          text: '#92400e'
        },
        warning: {
          bg: '#fed7aa',
          border: '#f97316',
          text: '#9a3412'
        },
        danger: {
          bg: '#fecaca',
          border: '#ef4444',
          text: '#991b1b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
  prefix: 'cs-' // Avoid conflicts with page styles
}
