/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#4f46e5", // Tasarımda kullanabileceğin şık bir mor/mavi
      }
    },
  },
  plugins: [],
}