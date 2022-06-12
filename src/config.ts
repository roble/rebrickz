import Phaser from "phaser"

/**
 * Customization
 */
const GAME_WIDTH = 380
const GAME_HEIGHT = 600
const GAME_ROWS = 8
const GAME_COLS = 6
const BLOCK_SIZE = GAME_HEIGHT / (GAME_ROWS + 4)
const WORLD_HEIGHT = GAME_ROWS * BLOCK_SIZE + BLOCK_SIZE
const WORLD_WIDTH = GAME_COLS * BLOCK_SIZE
const BALL_SIZE = 16

/**
 * Game Config
 */
export type GameConfigType = {
	rows: number
	cols: number
	width: number
	height: number
	trajectoryDistance: number
	ball: BallConfigType
	block: BlockConfigType
	world: WorldConfigType
}

export type BallConfigType = {
	size: number
	radius: number
	speed: number
	max: number
	delayBetweenBalls: number
}

export type BlockConfigType = {
	size: number
	max: {
		normal: number
		special: number
		extra: number
	}
	maxPerRow: number
	text: {
		style: Phaser.Types.GameObjects.Text.TextStyle
	}
	initialPositionY: number
	initialScale: number
	initialAlpha: number
	initialDepth: number
	defaultTexture: string
	// emitters: {
	// 	move: {}
	// 	fall: {}
	// 	destroy: {}
	// }
	tweens: {
		move: {
			delay: {
				min: number
				max: number
			}
			duration: number
			ease: string
		}
		fall: {
			delay: {
				min: number
				max: number
			}
			duration: number
			ease: string
		}
		// destroy: {}
	}
}

export type WorldConfigType = {
	width: number
	height: number
	defaultTexture: string
}

export const GameConfig: GameConfigType = {
	rows: GAME_ROWS,
	cols: GAME_COLS,
	width: GAME_WIDTH,
	height: GAME_HEIGHT,
	trajectoryDistance: 1000000,
	ball: {
		size: BALL_SIZE,
		radius: BALL_SIZE / 2,
		speed: 500,
		max: 48,
		delayBetweenBalls: 50,
	},
	block: {
		size: BLOCK_SIZE,
		max: {
			normal: 30,
			special: 2,
			extra: 2,
		},
		maxPerRow: GAME_COLS - 2,
		text: {
			style: {
				font: "bold 12px Arial",
				align: "center",
				color: "#000000",
			},
		},
		initialPositionY: -50,
		initialScale: 2,
		initialAlpha: 0,
		initialDepth: 0,
		defaultTexture: "block",
		// emitters: {
		// 	move: {},
		// 	fall: {},
		// 	destroy: {},
		// },
		tweens: {
			move: {
				delay: {
					min: 0,
					max: 200,
				},
				ease: "Quart.easeOut",
				duration: 200,
			},
			fall: {
				delay: {
					min: 0,
					max: 200,
				},
				duration: 500,
				ease: "Bounce",
			},
			// destroy: {},
		},
	},
	world: {
		width: WORLD_WIDTH,
		height: WORLD_HEIGHT,
		defaultTexture: "ground",
	},
}

/**
 * Phaser Game default configuration
 */
export const PhaserConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game",
	// backgroundColor: "#673ab7",
	backgroundColor: "#272b33",
	scale: {
		width: GameConfig.width,
		height: GameConfig.height,
		// mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	physics: {
		default: "arcade",
		arcade: {
			debug: false,
			debugShowBody: true,
			debugShowStaticBody: true,
			gravity: {
				x: 0,
				y: 0,
			},
		},
	},
}
