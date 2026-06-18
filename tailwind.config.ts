import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        calm: {
          50: '#EEF4FB',
          100: '#D6E8F5',
          200: '#ADCFEB',
          300: '#85B6E1',
          400: '#6BA3BE',
          500: '#4A87A8',
          600: '#3A6D8E',
          700: '#2B5470',
          800: '#1D3A52',
          900: '#0E1E2A',
        },
        ocean: '#4A90D9',
        forest: '#4A7C59',
        sand: '#F5E6CC',
        lavender: '#B8A9D9',
        sunshine: '#FFD166',
        coral: '#EF8C6E',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'pulse-calm': 'pulse-calm 2s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
