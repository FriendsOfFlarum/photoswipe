const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const path = require('path');

const baseConfig = require('flarum-webpack-config')();

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  /** @type {import('webpack').Configuration} */
  const customConfig = {
    plugins: [],
    module: {
      rules: [
        {
          test: /\.(sa|sc|c)ss$/,
          use: [!isProduction ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    optimization: {
      minimizer: ['...', new CssMinimizerPlugin()],
    },
  };

  if (isProduction) {
    customConfig.plugins.push(
      new MiniCssExtractPlugin({
        filename: `[name]_[contenthash].css`,
        chunkFilename: `chunk~[name]_[chunkhash].css`,
      })
    );
  }

  return merge(baseConfig, customConfig);
};
