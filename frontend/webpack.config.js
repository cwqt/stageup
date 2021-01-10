module.exports = {
  module: {
    rules: [
      {
        test: /tailwind\.scss$/,
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
           ident: 'postcss',
            syntax: 'postcss-scss',
            plugins: [
              require('postcss-import'),
              require('tailwindcss'),
              require('autoprefixer'),
            ],
          },
        },
      },
    ],
  },
};