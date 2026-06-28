import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        border: 'var(--border)',
        text: {
          DEFAULT: 'var(--text)',
          dim: 'var(--text-dim)',
          faint: 'var(--text-faint)',
        },
        ember: {
          1: 'var(--ember-1)',
          2: 'var(--ember-2)',
          3: 'var(--ember-3)',
        },
        mint: {
          DEFAULT: 'var(--mint)',
          dim: 'var(--mint-dim)',
        },
        ice: 'var(--ice)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '17px',
        pill: '999px',
      },
      boxShadow: {
        ember: '0 0 0 1px rgba(255,106,44,0.18), 0 8px 30px -8px rgba(255,45,85,0.35)',
        'ember-sm': '0 0 18px -4px rgba(255,106,44,0.45)',
        mint: '0 0 0 1px rgba(45,226,182,0.22), 0 8px 24px -10px rgba(45,226,182,0.30)',
        soft: '0 10px 40px -16px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'ember-grad': 'linear-gradient(120deg, var(--ember-1), var(--ember-3))',
        'ember-grad-soft': 'linear-gradient(120deg, rgba(255,178,61,0.16), rgba(255,45,85,0.16))',
        'heat-spectrum': 'linear-gradient(90deg, #5BA8FF, #2DE2B6, #FFB23D, #FF6A2C, #FF2D55)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-ember': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'count-glow': {
          '0%': { textShadow: '0 0 0px rgba(255,106,44,0)' },
          '50%': { textShadow: '0 0 22px rgba(255,106,44,0.7)' },
          '100%': { textShadow: '0 0 0px rgba(255,106,44,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-ember': 'pulse-ember 2s ease-in-out infinite',
        'count-glow': 'count-glow 1.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
