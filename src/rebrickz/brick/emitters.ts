import { Base } from "./base"

interface emitter {
	[key: string]: {
		name: string
		particle: string
		config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
	}
}

const defaultConfig = {
	EXPLOSION: {
		scale: {
			start: 0.8,
			end: 0.1,
		},
		speed: 70,
		alpha: {
			min: 0.05,
			max: 0.25,
		},
		active: false,
		lifespan: 800,
		quantity: 100,
		blendMode: Phaser.BlendModes.SCREEN,
	},
	UP: {
		scale: {
			start: 0.8,
			end: 0.1,
		},
		speed: 15,
		alpha: {
			min: 0,
			max: 0.1,
		},
		active: true,
		lifespan: 800,
		quantity: 2,
		blendMode: Phaser.BlendModes.SCREEN,
	},
}

export class Emitters {
	static readonly EMITTERS: emitter = {
		EXPLOSION_GREEN: {
			name: "EXPLOSION_GREEN",
			particle: "extra_ball",
			config: {
				...defaultConfig.EXPLOSION,
				gravityY: 200,
			},
		},
		HEART_UP: {
			name: "HEART_UP",
			particle: "life",
			config: {
				...defaultConfig.UP,
				gravityY: -50,
			},
		},
		GREEN_UP: {
			name: "GREEN_UP",
			particle: "extra_ball",
			config: {
				...defaultConfig.UP,
				gravityY: -50,
			},
		},
		EXPLOSION_HEART_UP: {
			name: "EXPLOSION_HEART_UP",
			particle: "life",
			config: {
				...defaultConfig.EXPLOSION,
				gravityY: -10,
			},
		},
		EXPLOSION_HEART_DOWN: {
			name: "EXPLOSION_HEART_DOWN",
			particle: "life",
			config: {
				...defaultConfig.EXPLOSION,
				gravityY: 200,
			},
		},
		EXPLOSION_YELLOW: {
			name: "EXPLOSION_YELLOW",
			particle: "block",
			config: {
				...defaultConfig.EXPLOSION,
			},
		},
	}

	private scene: Phaser.Scene
	emitters: { [key: string]: Phaser.GameObjects.Particles.ParticleEmitter }
	follow: Base

	constructor(scene: Phaser.Scene, follow: Base) {
		this.scene = scene
		this.emitters = {}
		this.follow = follow
	}

	create(key: keyof emitter, options?: { offset?: { x?: number; y?: number }; trackVisible?: boolean }) {
		const emitterConfig = Emitters.EMITTERS[key]
		const emitter = this.scene.add.particles(emitterConfig.particle).createEmitter(emitterConfig.config)

		emitter.startFollow(this.follow, options?.offset?.x, options?.offset?.y, options?.trackVisible)

		this.emitters[key] = emitter
	}

	start(key?: keyof emitter): this {
		if (!key) {
			Object.keys(this.emitters).forEach((key) => {
				this.emitters[key].active = true
			})
		} else {
			this.emitters[key].active = true
		}

		return this
	}

	stop(key?: keyof emitter): this {
		if (!key) {
			Object.keys(this.emitters).forEach((key) => {
				this.emitters[key].active = false
			})
		} else {
			this.emitters[key].active = false
		}
		return this
	}

	explode(key?: keyof emitter, quantity = 20, x = 0, y = 0): this {
		if (!key) {
			Object.keys(this.emitters).forEach((key) => {
				this.start(key)
				this.emitters[key].explode(quantity, x, y)
			})
		} else {
			this.start(key)
			this.emitters[key].explode(quantity, x, y)
		}

		return this
	}
}
