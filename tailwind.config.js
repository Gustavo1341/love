/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: { 
          primary: '#FF6B6B',
          background: '#202026',
          foreground: '#FFFFFF',
        },
        animation: { 
          pulse: 'pulse 2s ease-in-out infinite',
          heartFall: 'heartFall var(--duration, 5s) linear var(--delay, 0s) forwards' 
        },
        keyframes: { 
          pulse: {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
          },
          heartFall: {
            '0%': {
              transform: 'translateY(0) rotate(0deg)',
              opacity: '1',
            },
            '100%': {
              transform: 'translateY(calc(100vh + 100px)) rotate(360deg)',
              opacity: '0',
            },
          }
        }
      },
    },
    plugins: [],
  }