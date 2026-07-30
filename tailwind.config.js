/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Proxima Nova"', '-apple-system', '"Helvetica Neue"', 'Helvetica', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        gym: {
          blue: {
            DEFAULT: 'rgb(var(--gym-blue) / <alpha-value>)',
            50: 'rgb(var(--gym-blue-50) / <alpha-value>)',
            100: 'rgb(var(--gym-blue-100) / <alpha-value>)',
            200: 'rgb(var(--gym-blue-200) / <alpha-value>)',
            500: 'rgb(var(--gym-blue) / <alpha-value>)',
            600: 'rgb(var(--gym-blue-600) / <alpha-value>)',
            700: '#1D4ED8',
            800: '#1E40AF',
            900: '#1E3A8A',
          },
          gray: {
            100: 'rgb(var(--gym-gray-100) / <alpha-value>)',
            200: 'rgb(var(--gym-gray-200) / <alpha-value>)',
            300: 'rgb(var(--gym-gray-300) / <alpha-value>)',
            400: 'rgb(var(--gym-gray-400) / <alpha-value>)',
            500: 'rgb(var(--gym-gray-500) / <alpha-value>)',
            600: 'rgb(var(--gym-gray-600) / <alpha-value>)',
            700: 'rgb(var(--gym-gray-700) / <alpha-value>)',
            800: 'rgb(var(--gym-gray-800) / <alpha-value>)',
            900: 'rgb(var(--gym-gray-900) / <alpha-value>)',
          }
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
