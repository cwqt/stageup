module.exports = (isProd) => ({
  prefix: '',
  purge: {
    enabled: isProd,
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
