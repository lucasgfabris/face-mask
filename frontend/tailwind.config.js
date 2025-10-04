/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D547F',
        secondary: '#83CEF6',
        accent: '#0D547F',
        success: '#2FC26E',
        error: '#EF4444',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '1rem',
      },
      boxShadow: {
        'custom': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'button': '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
