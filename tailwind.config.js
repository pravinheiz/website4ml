/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a1a35',
        accent: '#00a1ff',
        secondary: '#1a0a35',
        accent2: '#c13cff',
        backgroundDark: '#0a0a1a',
      },
      boxShadow: {
        glow: '0 0 15px #00a1ff',
        glowPink: '0 0 12px #c13cff',
        glowStrong: '0 0 25px #00a1ff',
      },
      animation: {
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        fadeIn: 'fadeIn 1s ease-in',
        slideIn: 'slideIn 0.5s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px #00a1ff' },
          '50%': { boxShadow: '0 0 20px #00a1ff, 0 0 30px #00a1ff' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      fontFamily: {
        gaming: ['Orbitron', 'monospace'],
      },
    },
  },
  plugins: [],
}