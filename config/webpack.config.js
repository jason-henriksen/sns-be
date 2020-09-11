const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  target: 'node',
  optimization: {
    minimizer: [
      new TerserPlugin()
    ]
  },
  externals: {
    'aws-sdk': 'aws-sdk'
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    esIndexReport: './src/elasticSearchLog/esIndexReport.js',
    esIndexSetup: './src/elasticSearchLog/esIndexSetup.js',

    onConnect: './src/websocket/onConnect.js',
    onDisconnect: './src/websocket/onDisconnect.js',
    onSendMessage: './src/websocket/onSendMessage.js',

    webhook: './src/webhook/webhook.js',

    actorSubscribe: './src/uiActions/actorSubscribe.js',
    actorUnSubscribe: './src/uiActions/actorUnSubscribe.js',

    agentSubscribe: './src/uiActions/agentSubscribe.js',
    agentUnSubscribe: './src/uiActions/agentUnSubscribe.js',
    
    producerNotify: './src/uiActions/producerNotify.js',
  },

  output: {
    path: `${process.cwd()}/build/dist`,
    filename: '[name].js',

    //path: path.resolve(__dirname, 'build'),
    //filename: 'index.js',
    library: 'index',
    libraryTarget: 'commonjs2'
  },
  plugins: [
    new webpack.IgnorePlugin(/^pg-native$/),
    new webpack.DefinePlugin({
      'process.env.BROWSER': false,
      __DEV__: process.env.NODE_ENV !== 'production',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(mjs|js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          configFile: './config/babel.config.js'
        }
      }
    ],
  }
};
