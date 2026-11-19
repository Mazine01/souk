import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: token('paper'),
        surface: token('surface'),
        sunken: token('sunken'),
        ink: { DEFAULT: token('ink'), muted: token('ink-muted') },
        rule: { DEFAULT: token('rule'), strong: token('rule-strong') },
        brand: { DEFAULT: token('brand'), ink: token('brand-ink'), soft: token('brand-soft') },
        saffron: { DEFAULT: token('saffron'), soft: token('saffron-soft') },
        mint: { DEFAULT: token('mint'), soft: token('mint-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Inter Variable"', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['24px', '30px'],
        '2xl': ['32px', '36px'],
        '3xl': ['48px', '50px'],
        '4xl': ['64px', '64px'],
      },
      borderRadius: { control: '10px', panel: '16px' },
      boxShadow: { panel: 'var(--shadow-panel)' },
    },
  },
  plugins: [],
} satisfies Config;
