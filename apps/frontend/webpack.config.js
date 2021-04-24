'use strict';
const webpack = require('webpack');
const path = require('path');

module.exports = {
  devServer: {
    // SET TO FALSE IN PROD
    disableHostCheck: true
  },
  resolve: {
    alias: {
      frontend: path.join(__dirname, 'apps/frontend/src/app')
    }
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
