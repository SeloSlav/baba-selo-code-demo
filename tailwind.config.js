/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        'sleeping-z-float-1': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0 },
          '25%': { transform: 'translate(3px, -3px) scale(1)', opacity: 1 },
          '75%': { transform: 'translate(12px, -12px) scale(0.9)', opacity: 1 },
          '100%': { transform: 'translate(15px, -15px) scale(0.8)', opacity: 0 }
        },
        'sleeping-z-float-2': {
          '0%': { transform: 'translate(0, 0) scale(0.9)', opacity: 0 },
          '25%': { transform: 'translate(3px, -3px) scale(0.9)', opacity: 1 },
          '75%': { transform: 'translate(10px, -10px) scale(0.8)', opacity: 1 },
          '100%': { transform: 'translate(12px, -12px) scale(0.7)', opacity: 0 }
        },
        'sleeping-z-float-3': {
          '0%': { transform: 'translate(0, 0) scale(0.8)', opacity: 0 },
          '25%': { transform: 'translate(2px, -2px) scale(0.8)', opacity: 1 },
          '75%': { transform: 'translate(8px, -8px) scale(0.7)', opacity: 1 },
          '100%': { transform: 'translate(10px, -10px) scale(0.6)', opacity: 0 }
        },
        'slow-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15%)' }
        }
      },
      animation: {
        'sleeping-z-1': 'sleeping-z-float-1 2s ease-in-out infinite',
        'sleeping-z-2': 'sleeping-z-float-2 2s ease-in-out infinite 0.7s',
        'sleeping-z-3': 'sleeping-z-float-3 2s ease-in-out infinite 1.4s',
        'slow-bounce': 'slow-bounce 2.5s ease-in-out infinite'
      }
    },
  },
  plugins: [],
};
