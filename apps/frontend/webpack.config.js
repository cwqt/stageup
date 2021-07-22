'use strict';
const webpack = require('webpack');
const path = require('path');
const colors = require('colors');

module.exports = async (config, context) => {
  console.log(colors.blue('Webpack'), 'running in', config.mode);

  // Have to append data onto Nx config like this otherwise it errors
  config.resolve.alias = { ...config.resolve.alias, frontend: path.join(__dirname, 'apps/frontend/src/app') };

  config.module.rules.push({
    test: /tailwind\.scss$/,
    loader: 'postcss-loader',
    options: {
      postcssOptions: {
        ident: 'postcss',
        syntax: 'postcss-scss',
        plugins: [
          require('postcss-import'),
          require('tailwindcss')(require('./tailwind.config.js')(config.mode !== 'development')),
          require('autoprefixer')
        ]
      }
    }
  });

  config.module.rules.push({
    test: /\.scss$/,
    loader: 'sass-loader'
  });

  config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/));

  return config;
};
