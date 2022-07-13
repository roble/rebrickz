import { defineConfig } from "vite"
import replace from "@rollup/plugin-replace"
import path from "path"

export default defineConfig({
	resolve: {
		alias: {
			"@rebrickz": path.resolve(__dirname, "./src/rebrickz/"),
			"@config": path.resolve(__dirname, "./src/config.ts"),
			"@helpers": path.resolve(__dirname, "./src/helpers.ts"),
			"@assets": path.resolve(__dirname, "./src/assets/"),
			"@objects": path.resolve(__dirname, "./src/objects/"),
			"@scenes": path.resolve(__dirname, "./src/scenes/"),
		},
		extensions: [".ts", ".tsx", ".js"],
	},
	base: '/rebrickz/',
	build: {
		emptyOutDir: true,
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			manualChunks: {
				phaser: ['phaser']
			},
			plugins: [
				//  Toggle the booleans here to enable / disable Phaser 3 features:
				replace({
					preventAssignment: true,
					"process.browser": true,
					"typeof CANVAS_RENDERER": "'true'",
					"typeof WEBGL_RENDERER": "'true'",
					"typeof EXPERIMENTAL": "'true'",
					"typeof PLUGIN_CAMERA3D": "'false'",
					"typeof PLUGIN_FBINSTANT": "'false'",
					"typeof FEATURE_SOUND": "'true'",
				}),
			],
		},
	},
})
