/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf1ec',
          100: '#fad9c9',
          200: '#f5b49a',
          300: '#ee8463',
          400: '#e05528',
          500: '#b83a12',
          600: '#8c2e0a',
          700: '#6b2108',
          800: '#4d1806',
          900: '#2e0e03',
        },
        green: {
          shop: '#16713f',
          light: '#e6f7ee',
        },
        amber: {
          shop: '#9a5c00',
          light: '#fff6e0',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      animation: {
        'bounce-slow': 'bounce 1.2s ease infinite',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'slide-in-right': 'slideInRight 0.35s ease forwards',
        'pulse-dot': 'pulseDot 2s ease infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(40px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseDot:     { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
      boxShadow: {
        'brand': '0 4px 20px rgba(184,58,18,0.25)',
        'card':  '0 2px 16px rgba(120,60,20,0.09)',
        'card-hover': '0 8px 32px rgba(120,60,20,0.15)',
      },
    },
  },
  plugins: [],
};
