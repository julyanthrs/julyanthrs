import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050505',
        ink: '#090909',
        carbon: '#0D0D0D',
        hot: '#FF2D95',
        flare: '#FF4FA3',
        blush: '#FF9FCC',
        petal: '#FFC1DC',
        muted: '#AFAFAF',
      },
      fontFamily: {
        display: ['Archivo', 'Arial Narrow', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      screens: { xs: '420px' },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.76, 0, 0.24, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
