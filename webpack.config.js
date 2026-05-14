const glob = require('glob');
const path = require('path');
const { exec } = require('child_process');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const ESLintPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const mode = 'development';
const stats = { children: false };
require('dotenv').config();
const storeUrl = process.env.STORE_URL;
const themeId = process.env.THEME_ID;

const scssEntryPoint = glob.sync('./scss/sections/**.scss').reduce((acc, p) => {
  acc[p.replace(/^.*[\\\/]/, '').replace('.scss', '')] = p;
  return acc;
}, {});

const tsEntryPoints = glob.sync('./ts/sections/**/*.{ts,tsx}').reduce((acc, p) => {
  const key = p.replace(/^.*[\\\/]/, '').replace(/\.(ts|tsx)$/, '');
  acc[key] = p.startsWith('.') ? p : `./${p}`;
  return acc;
}, {});

const jsEntryPoints = glob.sync('./js/sections/**/*.{js,jsx}').reduce((acc, p) => {
  const key = p.replace(/^.*[\\\/]/, '').replace(/\.(js|jsx)$/, '');
  acc[key] = p.startsWith('.') ? p : `./${p}`;
  return acc;
}, {});

const entry = { ...scssEntryPoint, ...tsEntryPoints, ...jsEntryPoints };

function playFailSoundPlugin() {
  const errorSound = path.resolve(__dirname, 'sounds/fahhhhh.mp3');
  return {
    apply(compiler) {
      compiler.hooks.done.tap('PlayFailSound', (stats) => {
        if (stats.hasErrors() && process.platform === 'darwin') {
          exec(`afplay "${errorSound}"`, () => {});
        }
      });
    },
  };
}

module.exports = {
  mode,
  stats,
  context: __dirname,
  entry,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    preferRelative: true,
    alias: {
      StyleComponents: path.resolve(__dirname, 'scss/components'),
      TsComponents: path.resolve(__dirname, 'ts/components')
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.(sc|sa)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { url: false },
          },
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              api: 'modern',
              implementation: require('sass'),
            },
          },
        ],
      },
    ],
  },
  output: {
    clean: false,
    filename: './[name].js',
    path: path.resolve(__dirname, 'assets'),
    chunkFilename: (pathData) => {
      const name = pathData.chunk?.name;
      if (name === 'shared') return './[name].js';
      return './[name].[contenthash].js';
    },
  },
  devtool: 'source-map',
  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: 'all',
      usedExports: true,
      cacheGroups: {
        default: false,
        Vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          type: /javascript/,
          enforce: true,
        },
        common: {
          chunks: 'all',
          minChunks: 2,
          name: 'shared',
          priority: -20,
          minSize: 0,
          type: /javascript/,
        },
      },
    },
    minimize: true,
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      async: false,
      typescript: { configFile: path.join(__dirname, 'tsconfig.json') },
      issue: { exclude: [{ origin: 'eslint', severity: 'warning' }] },
    }),
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: './[name].css',
    }),
    new ESLintPlugin({
      context: path.join(__dirname, 'ts'),
      extensions: ['ts', 'tsx'],
      failOnError: true,
      eslintPath: 'eslint/use-at-your-own-risk',
      overrideConfigFile: path.join(__dirname, '.eslintrc.cjs'),
    }),
    playFailSoundPlugin(),
  ],
};
module.exports.plugins.push(
  new WebpackShellPluginNext({
    onBuildStart: {
      scripts: ['echo Webpack build in progress...🛠'],
    },
    onBuildEnd: {
      scripts: ['echo Build Complete 📦', `shopify theme dev --theme-editor-sync -s ${storeUrl} -t ${themeId}`],
      parallel: true,
    },
  })
);
