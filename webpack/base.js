const webpack = require("webpack")
const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
	mode: "development",
	devtool: "eval-source-map",
	module: {
		rules: [
			{
				test: /\.tsx?$|\.jsx?$/,
				include: path.join(__dirname, "../src"),
				loader: "ts-loader",
			},
		],
	},
	resolve: {
		alias: {
			"@rebrickz": path.resolve(__dirname, "../src/rebrickz/"),
			"@config": path.resolve(__dirname, "../src/config.ts"),
			"@helpers": path.resolve(__dirname, "../src/helpers.ts"),
			"@assets": path.resolve(__dirname, "../src/assets/"),
			"@objects": path.resolve(__dirname, "../src/objects/"),
			"@scenes": path.resolve(__dirname, "../src/scenes/"),
		},
		extensions: [".ts", ".tsx", ".js"],
	},
	plugins: [
		new CleanWebpackPlugin({
			root: path.resolve(__dirname, "../"),
		}),
		new webpack.DefinePlugin({
			CANVAS_RENDERER: JSON.stringify(true),
			WEBGL_RENDERER: JSON.stringify(true),
		}),
		new HtmlWebpackPlugin({
			template: "./src/index.html",
		}),
		new CopyWebpackPlugin({
			patterns: [
				{ from: "src/assets", to: "assets" },
				{ from: "src/favicon.ico", to: "" },
			],
		}),
	],
}
