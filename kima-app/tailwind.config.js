/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B3A6B',
          50: '#E8EDF5',
          100: '#C5D0E6',
          200: '#8FA3CC',
          300: '#5976B2',
          400: '#2E5298',
          500: '#1B3A6B',
          600: '#152E56',
          700: '#0F2240',
          800: '#0A162B',
          900: '#050B15',
        },
        secondary: {
          DEFAULT: '#C8922A',
          50: '#FBF3E4',
          100: '#F4DFB9',
          200: '#E8C07A',
          300: '#DCA13B',
          400: '#C8922A',
          500: '#A87623',
          600: '#885F1C',
          700: '#684815',
          800: '#48320F',
          900: '#281C08',
        },
      },
      fontFamily: {
        sans: ['NotoSansKR-Regular'],
        medium: ['NotoSansKR-Medium'],
        bold: ['NotoSansKR-Bold'],
      },
    },
  },
  plugins: [],
}
