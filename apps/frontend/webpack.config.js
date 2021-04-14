'use strict';
const webpack = require('webpack');

module.exports = {
  devServer: {
    // SET TO FALSE IN PROD
    disableHostCheck: true
  },
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
              require('tailwindcss')(require('./tailwind.config.js')(false)),
              require('autoprefixer')
            ]
          }
        }
      },
      {
        test: /\.scss$/,
        loader: 'sass-loader'
      }
    ]
  },
  plugins: [new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)]
};
