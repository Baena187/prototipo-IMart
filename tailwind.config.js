/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        navy: {
          50: '#f1f4f9',
          100: '#e1e7f1',
          200: '#c3cfe2',
          300: '#94a8c6',
          400: '#5f7aa3',
          500: '#3d5a86',
          600: '#2a4470',
          700: '#1d3359',
          800: '#14264a',
          900: '#0c1a36',
          950: '#081227',
        },
        accent: {
          50: '#fff6ed',
          100: '#ffead5',
          200: '#fed2aa',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(12 26 54 / 0.05)',
        pop: '0 12px 32px -8px rgb(12 26 54 / 0.18), 0 2px 8px -2px rgb(12 26 54 / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(.97) translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 160ms ease-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'toast-in': 'toast-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
