const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/new-crm.js',

  output: {
    path: path.resolve(__dirname, 'build/new-crm'),
    filename: process.env.NODE_ENV === 'production'
      ? 'static/js/[name].[contenthash:8].js'
      : 'static/js/[name].[contenthash:8].bundle.js',
    chunkFilename: process.env.NODE_ENV === 'production'
      ? 'static/js/[name].[contenthash:8].chunk.js'
      : 'static/js/[name].[contenthash:8].chunk.js',
    publicPath: '/new-crm/',
    clean: true,
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    modules: [
      'node_modules',
      path.resolve(__dirname, 'src')
    ],
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', 'ie >= 11']
                },
                useBuiltIns: 'usage',
                corejs: 3
              }],
              ['@babel/preset-react', {
                runtime: 'automatic'
              }]
            ],
            plugins: [],
            cacheDirectory: true,
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8192 // 8kb
          }
        },
        generator: {
          filename: 'static/media/[name].[hash:8][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[hash:8][ext]'
        }
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/new-crm.html',
      filename: 'index.html',
      inject: 'body',
      minify: process.env.NODE_ENV === 'production' ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false,
    }),

    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.PUBLIC_URL': JSON.stringify('/new-crm'),
      'process.env.REACT_APP_OPENCLAW_GATEWAY_URL': JSON.stringify(process.env.REACT_APP_OPENCLAW_GATEWAY_URL || 'ws://localhost:18789'),
      'process.env.REACT_APP_OPENCLAW_GATEWAY_TOKEN': JSON.stringify(process.env.REACT_APP_OPENCLAW_GATEWAY_TOKEN || ''),
    }),
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  },

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/new-crm/',
    },
    port: 3002,
    hot: true,
    open: '/new-crm/',
    historyApiFallback: {
      index: '/new-crm/index.html',
      rewrites: [
        { from: /^\/new-crm\/.*$/, to: '/new-crm/index.html' }
      ]
    },
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    }
  },

  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',

  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};