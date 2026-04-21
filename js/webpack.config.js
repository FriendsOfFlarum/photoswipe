const { merge } = require('webpack-merge');
const baseConfig = require('flarum-webpack-config')();

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return merge(
    baseConfig,
    /** @type {import('webpack').Configuration}*/ {
      module: {
        rules: [
          {
            test: /\.(sa|sc|c)ss$/,
            use: ['style-loader', 'css-loader'],
          },
        ],
      },
    }
  );
};
