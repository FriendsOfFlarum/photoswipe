const { merge } = require('webpack-merge');
const baseConfig = require('flarum-webpack-config')();

module.exports = (env, argv) => {
  return merge(
    baseConfig,
    /** @type {import('webpack').Configuration}*/
    {
      module: {
        rules: [
          {
            test: /\.(sa|sc|c)ss$/,
            // Flarum doesn't copy CSS from js/dist/forum, so we don't extract it and bundle it with the JavaScript.
            use: ['style-loader', 'css-loader'],
          },
        ],
      },
    }
  );
};
