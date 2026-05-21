/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Couleurs sidebar navy — forcer la génération
    'bg-rdc-navy', 'bg-rdc-navy-hover', 'bg-rdc-navy-active',
    'border-rdc-navy-border', 'text-rdc-navy',
    'bg-rdc-blue', 'bg-rdc-yellow', 'bg-rdc-red',
    'text-rdc-blue', 'text-rdc-red', 'text-rdc-yellow',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        rdc: {
          blue:           '#007FFF',
          'blue-dark':    '#005BBB',
          'blue-light':   '#E8F3FF',
          yellow:         '#F7D618',
          'yellow-light': '#FFFBE8',
          red:            '#CE1126',
          'red-light':    '#FFF0F0',
          // Sidebar
          navy:           '#0D2B6E',
          'navy-hover':   '#1A3A82',
          'navy-active':  '#1E4599',
          'navy-border':  '#2A5299',
        },
      },
    },
  },
  plugins: [],
};
