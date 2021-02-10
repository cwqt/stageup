module.exports = (isProd) => ({
  prefix: '',
  purge: {
    enabled: false,
    content: [
      '**/*.html',
      '**/*.ts',
    ]
  },
  darkMode: false, // or 'media' or 'class'
  theme: {},
  variants: {
    extend: {},
  },
  plugins: [require('tailwindcss-aspect-ratio')]
});