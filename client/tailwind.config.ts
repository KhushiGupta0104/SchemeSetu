import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFFBF9',
          100: '#DDF7F3',
          200: '#B4ECE4',
          300: '#7DDBD0',
          400: '#3DBFB4',
          500: '#12A0A0',
          600: '#087F8C',
          700: '#075E68',
          800: '#0A4B53',
          900: '#0B3D44',
        },
        indigo: { 50: '#EEF2FF', 100: '#E0E7FF', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA' },
        ink: { DEFAULT: '#0F172A', soft: '#334155', muted: '#64748B' },
        line: '#E2E8F0',
        canvas: '#F8FAFC',
        success: { DEFAULT: '#15803D', soft: '#DCFCE7' },
        warning: { DEFAULT: '#B45309', soft: '#FEF3C7' },
        danger: { DEFAULT: '#B91C1C', soft: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Noto Sans Devanagari"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        lift: '0 10px 30px -12px rgba(8,127,140,0.25), 0 4px 10px -6px rgba(15,23,42,0.08)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { shimmer: 'shimmer 1.4s infinite' },
    },
  },
  plugins: [],
} satisfies Config;
