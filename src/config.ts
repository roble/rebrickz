import Phaser from "phaser"

/**
 * Customization
 */
const GAME_WIDTH = 380
const GAME_HEIGHT = 600
const GAME_ROWS = 8
const GAME_COLS = 6
const PADDING_X = 80
const WORLD_WIDTH = GAME_WIDTH - PADDING_X
const BLOCK_SIZE = WORLD_WIDTH / GAME_COLS

/**
 * Game Config
 */
export type GameConfigType = {
	rows: number
	cols: number
	width: number
	height: number
	ball: BallConfigType
	block: BlockConfigType
	world: WorldConfigType
}

export type BallConfigType = {
	size: number
	speed: number
	max: number
	delayBetweenBalls: number
}

export type BlockConfigType = {
	size: number
	max: number
	text: {
		style: Phaser.Types.GameObjects.Text.TextStyle
	}
	initialPositionY: number
	initialScale: number
	initialAlpha: number
	initialDepth: number
	defaultTexture: string
	emitters: {
		move: {}
		fall: {}
		destroy: {}
	}
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
		destroy: {}
	}
}

export type WorldConfigType = {
	width: number
	height: number
	paddingX: Number
	defaultTexture: string
}

export const GameConfig: GameConfigType = {
	rows: GAME_ROWS,
	cols: GAME_COLS,
	width: GAME_WIDTH,
	height: GAME_HEIGHT,
	ball: {
		size: 16,
		speed: 750,
		max: 48,
		delayBetweenBalls: 50,
	},
	block: {
		size: BLOCK_SIZE,
		max: 48,
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
		emitters: {
			move: {},
			fall: {},
			destroy: {},
		},
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
			destroy: {},
		},
	},
	world: {
		width: WORLD_WIDTH,
		height: GAME_ROWS * BLOCK_SIZE,
		paddingX: PADDING_X,
		defaultTexture: "ground",
	},
}

/**
 * Phaser Game default configuration
 */
export const PhaserConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game",
	backgroundColor: "#673ab7",
	banner: { hidePhaser: true },
	scale: {
		width: GameConfig.width,
		height: GameConfig.height,
		// mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	physics: {
		default: "arcade",
		arcade: {
			debug: true,
			gravity: {
				x: 0,
				y: 0,
			},
		},
	},
}
