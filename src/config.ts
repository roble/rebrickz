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

interface minMax {
	min: number
	max: number
}
/**
 * Game Config
 */
export type GameConfigType = {
	rows: number
	cols: number
	width: number
	height: number
	marginTop: number
	trajectoryDistance: number
	ball: BallConfigType
	brick: BlockConfigType
	world: WorldConfigType
	lives: number
	gameSpeed: 1
}

export type BallConfigType = {
	size: number
	radius: number
	speed: number
	max: number
	startBalls: number
	delayBetweenBalls: number
	criticalRate: number
	criticalHealthPercentage: number
	instantKillRate: number
	tweens: {
		move: {
			delay: minMax
			ease: "Quart.easeOut"
			duration: number
		}
	}
}

export type BlockConfigType = {
	size: number
	max: {
		normal: number
		special: number
		extra: number
		life: number
	}
	dropProbability: {
		special: number
		extra: number
		life: number
	}
	dropOnRows: {
		normal: minMax
		special: minMax
		extra: minMax
		life: minMax
	}
	maxPerRow: number
	text: {
		style: Phaser.Types.GameObjects.Text.TextStyle
	}
	levelIncrement: number
	initialPositionY: number
	initialScale: number
	initialAlpha: number
	initialDepth: number
	defaultTexture: string

	tweens: {
		move: {
			delay: minMax
			duration: number
			ease: string
		}
		fall: {
			delay: minMax
			duration: number
			ease: string
		}
	}
}

export type WorldConfigType = {
	width: number
	height: number
	left: number
	right: number
	top: number
	defaultTexture: string
}

export const GameConfig: GameConfigType = {
	rows: GAME_ROWS,
	cols: GAME_COLS,
	width: GAME_WIDTH,
	height: GAME_HEIGHT,
	marginTop: -30,
	trajectoryDistance: 1000000,
	lives: 5,
	gameSpeed: 1,
	ball: {
		size: BALL_SIZE,
		radius: BALL_SIZE / 2,
		speed: 500,
		max: 48,
		startBalls: 3,
		delayBetweenBalls: 100,
		criticalRate: 0.5, //0.5%
		criticalHealthPercentage: 0.4, //40%
		instantKillRate: 0.15, // 0.15%
		tweens: {
			move: {
				delay: {
					min: 0,
					max: 300,
				},
				ease: "Quart.easeOut",
				duration: 200,
			},
		},
	},
	brick: {
		size: BLOCK_SIZE,
		levelIncrement: 1.25,
		max: {
			normal: 36,
			special: 2,
			extra: 2,
			life: 10,
		},
		dropProbability: {
			special: 15,
			extra: 50,
			life: 10,
		},
		dropOnRows: {
			normal: {
				min: 1,
				max: 2,
			},
			special: {
				min: 0,
				max: GAME_ROWS - 1,
			},
			extra: {
				min: 0,
				max: GAME_ROWS - 1,
			},
			life: {
				min: 0,
				max: GAME_ROWS - 1,
			},
		},
		maxPerRow: GAME_COLS - 2,
		text: {
			style: {
				font: "bold 12px Arial Black",
				align: "center",
				color: "#000000",
			},
		},
		initialPositionY: -50,
		initialScale: 2,
		initialAlpha: 0,
		initialDepth: 0,
		defaultTexture: "block",
		tweens: {
			move: {
				delay: {
					min: 0,
					max: 300,
				},
				ease: "Linear",
				duration: 600,
			},
			fall: {
				delay: {
					min: 0,
					max: 200,
				},
				duration: 500,
				ease: "Bounce",
			},
		},
	},
	world: {
		width: WORLD_WIDTH,
		height: WORLD_HEIGHT,
		left: (GAME_WIDTH - WORLD_WIDTH) / 2,
		right: (GAME_WIDTH - WORLD_WIDTH) / 2,
		top: 70,
		defaultTexture: "ground",
	},
}

/**
 * Phaser Game default configuration
 */
export const PhaserConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game",
	backgroundColor: "#272b33",
	scale: {
		width: GameConfig.width,
		height: GameConfig.height,
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
