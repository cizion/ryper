const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    port: 9090,
    contentBase: path.resolve(__dirname, "./dist"),
    contentBasePublicPath: "/",
    historyApiFallback: { disableDotRule: true, index: "/" },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, content-types, Authorization, Accept",
    },
  },
});
