/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        colors: {
          'custom-blue': '#3b82f6', // Example of a custom color
        },
        spacing: {
          '72': '18rem',       // Example of a custom spacing
          '84': '21rem',
          '96': '24rem',
        },
      },
    },
    plugins: [],
  }
  