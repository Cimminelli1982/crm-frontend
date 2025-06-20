/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          black: '#000000',
          dark: '#0a0a0a',
          green: '#00ff00',
          'green-dark': '#00cc00',
          'green-light': '#33ff33',
          gray: '#333333',
          'gray-light': '#666666',
          text: '#00ff00',
          'text-dim': '#009900',
        },
      },
      fontFamily: {
        matrix: ['Courier New', 'Courier', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'matrix-glow': 'matrixGlow 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        matrixGlow: {
          '0%, 100%': { textShadow: '0 0 5px #00ff00' },
          '50%': { textShadow: '0 0 10px #00ff00, 0 0 15px #00ff00' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'matrix': '0 0 5px rgba(0, 255, 0, 0.3)',
        'matrix-lg': '0 0 10px rgba(0, 255, 0, 0.5)',
        'matrix-xl': '0 0 15px rgba(0, 255, 0, 0.7)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

