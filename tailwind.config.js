/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF8FF',
        primary: {
          DEFAULT: '#003EC7',
          container: '#0052FF',
          dark: '#001452',
          light: '#DDE1FF',
          variant: '#B7C4FF',
        },
        secondary: {
          DEFAULT: '#505F76',
          container: '#D0E1FB',
          dark: '#0B1C30',
        },
        surface: {
          DEFAULT: '#FAF8FF',
          container: '#EAEDFF',
          high: '#E2E7FF',
          low: '#F2F3FF',
          lowest: '#FFFFFF',
          variant: '#DAE2FD',
        },
        on: {
          surface: '#131B2E',
          variant: '#434656',
        },
        outline: {
          DEFAULT: '#737688',
          variant: '#C3C5D9',
        },
        tertiary: {
          DEFAULT: '#952200',
          container: '#BF3003',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
