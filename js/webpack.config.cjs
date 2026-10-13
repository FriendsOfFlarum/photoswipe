const { merge } = require('webpack-merge');
const baseConfig = require('flarum-webpack-config')();

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return merge(
    baseConfig,
    /** @type {import('webpack').Configuration} */
    {
      module: {
        rules: [
          {
            test: /\.(sa|sc|c)ss$/,
            // Flarum doesn't copy CSS from js/dist/forum, so we don't extract it and bundle it with the JavaScript.
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  sourceMap: !isProduction,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: !isProduction,
                },
              },
            ],
          },
        ],
      },
    }
  );
};
