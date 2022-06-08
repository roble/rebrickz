module.exports = {
	preset: "ts-jest",
	verbose: true,
	testEnvironment: "jsdom",
	transform: {
		"^.+\\.(ts|tsx)?$": "ts-jest",
		"^.+\\.(js|jsx)$": "babel-jest",
	},
	setupFiles: [
		"jest-canvas-mock"
	],
	moduleNameMapper: {
		"^@src(.*)$": ["<rootDir>/src$1"],
		"^@rebrickz": ["<rootDir>/src/rebrickz"],
		"^@config": ["<rootDir>/src/config"],
		"^@helpers": ["<rootDir>/src/helpers"],
		"^@scenes(.*)$": ["<rootDir>/src/scenes$1"],
		"^@objects(.*)$": ["<rootDir>/src/objects$1"],
		"^@assets(.*)$": ["<rootDir>/src/assets$1"]
	},
	setupFilesAfterEnv: [
		"<rootDir>/tests/setup.js"
	],
	"collectCoverageFrom": [
		"**/src/**",
		"!**/node_modules/**",
		"!**/vendor/**"
	]
}
