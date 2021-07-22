// safelist array not currently supported, hack in a file with all safelisted classes
// for the tailwind/jit compiler to keep them in https://github.com/tailwindlabs/tailwindcss-jit/issues/32

/**
 * @param {boolean} production
 */
module.exports = production => ({
  prefix: '',
  // jit not playing ball presently :/
  // mode: 'jit',
  purge: {
    enabled: production,
    content: ['**/*.html', '**/*.ts', './apps/frontend/tailwind-safelist.txt'],
    options: {
      safelist: [
        'col-span-1',
        'col-span-2',
        'col-span-3',
        'col-span-4',
        'col-span-5',
        'col-span-6',
        'col-span-7',
        'col-span-8',
        'col-span-9',
        'col-span-10',
        'col-span-11',
        'col-span-12'
      ]
    }
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    backgroundColor: theme => ({
      ...theme('colors'),
      'primary': '#ef4571',
  })},
  variants: {},
  plugins: [require('tailwindcss-aspect-ratio')]
});
