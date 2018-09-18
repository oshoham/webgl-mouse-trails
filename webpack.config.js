var path = require('path')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')

var SRC_DIR = path.resolve(__dirname, 'src')
var BUILD_DIR = path.resolve(__dirname, 'dist')

module.exports = {
  context: SRC_DIR,
  entry: {
    app: ['./index.js'],
  },
  output: {
    path: BUILD_DIR,
    publicPath: '/',
    filename: '[name].bundle.js',
  },
  devServer: {
    contentBase: BUILD_DIR,
    disableHostCheck: true
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['transform-object-rest-spread']
        }
      },
      {
        test: /\.(png|jpg|gif|cur)$/i,
        loader: 'url-loader'
      },
      { test: /\.(glsl|frag|vert)$/, loader: 'raw-loader', exclude: /node_modules/ },
      { test: /\.(glsl|frag|vert)$/, loader: 'glslify-loader', exclude: /node_modules/ }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(SRC_DIR, 'index.html'),
    })
  ]
}
