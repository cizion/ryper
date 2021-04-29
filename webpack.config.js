const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  // mode: "development",
  // devtool: "inline-source-map",
  entry: path.resolve(__dirname, "src"),

  output: {
    library: "ryper",
    libraryTarget: "umd",
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },

  resolve: {
    extensions: [".js", "jsx", ".ts", ".tsx", ".json"],
  },

  module: {
    rules: [
      { test: /\.(ts|js)x?$/, loader: "babel-loader", exclude: /node_modules/ },
    ],
  },

  plugins: [new ForkTsCheckerWebpackPlugin()],
};
