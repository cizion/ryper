const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

// TODO public files dist/public setting
// TODO src files dist/static/js setting
// TODO styles files dist/static/css setting
// TODO code size

module.exports = {
  // 진입점
  entry: {
    index: path.resolve(__dirname, "./src/index"),
  },
  // 결과값
  output: {
    filename: "js/[name].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
  // 확장자 자동
  resolve: {
    extensions: [".js", "jsx", ".ts", ".tsx", ".json"],
  },
  // loader setting
  module: {
    rules: [
      // babel loader & typescript
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      // css loader
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      // image loader
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      // font loader
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
      // ? file loader & url loader setting ?
      // ? data loader & json loader setting ?
      // ? hot module setting ?
    ],
  },
  //plugin setting
  plugins: [
    // dist 초기화
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),

    new ForkTsCheckerWebpackPlugin(),
    // html 생성 및 script tag 생성
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./public/index.html"),
    }),
    // css 파일 분리
    new MiniCssExtractPlugin(),
  ],
  // ? code split ?
  // code split
  optimization: {
    // moduleIds: 'deterministic',
    // runtimeChunk: 'single',
    // splitChunks: {
    //   chunks: 'all',
    //   cacheGroups: {
    //     vendor: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: 'vendors',
    //       chunks: 'all',
    //     },
    //   },
    // },
  },
};
