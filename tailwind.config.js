/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        'surface-dim': 'var(--color-sidebar)',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4ee',
        'surface-container': 'var(--color-surface)',
        'surface-container-high': '#e5e7eb',
        'surface-container-highest': '#d1d5db',
        'on-surface': 'var(--color-on-background)',
        'on-surface-variant': '#44474d',
        navy: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
        },
        emerald: {
          deep: 'var(--color-primary)',
          mint: '#9bf2e8',
        },
        cobalt: '#2563eb',
        'border-grid': '#e2e8f0',
      },
      fontFamily: {
        hanken: ['"Hanken Grotesk"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
};
