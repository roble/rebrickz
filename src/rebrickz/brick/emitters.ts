import { Ball } from ".."
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
			start: 1.5,
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
		NORMAL_BALL: {
			name: "NORMAL_BALL",
			particle: "particles",
			config: {
				radial: false,
				frame: "white-50",
				lifespan: 700,
				alpha: {
					end: 0.0,
					start: 0.7,
				},
				quantity: 1,
				// speed: 100,
				scale: { start: 0.7, end: 0, ease: "Power3" },

				blendMode: Phaser.BlendModes.SCREEN,
			},
		},
		HEART_UP: {
			name: "HEART_UP",
			particle: "particles",
			config: {
				...defaultConfig.UP,
				gravityY: -50,
				frame: "heart",
				scale: {
					min: 0.1,
					max: 0.6,
				},
				alpha: {
					end: 0.0,
					start: 0.2,
				},
				lifespan: 1000,
				quantity: 1,
				speed: 30,
				blendMode: Phaser.BlendModes.DIFFERENCE,
			},
		},
		GREEN_UP: {
			name: "GREEN_UP",
			particle: "particles",
			config: {
				...defaultConfig.UP,

				gravityY: -50,
			},
		},
		EXPLOSION_GREEN: {
			name: "EXPLOSION_GREEN",
			particle: "particles",
			config: {
				...defaultConfig.EXPLOSION,
				frame: "green",
				gravityY: 200,
			},
		},
		EXPLOSION_LIGHT_GREEN: {
			name: "EXPLOSION_LIGHT_GREEN",
			particle: "particles",
			config: {
				...defaultConfig.EXPLOSION,
				frame: "light-green",
				gravityY: 200,
			},
		},
		EXPLOSION_HEART_UP: {
			name: "EXPLOSION_HEART_UP",
			particle: "particles",
			config: {
				...defaultConfig.EXPLOSION,
				frame: "heart",
				gravityY: -10,
			},
		},
		EXPLOSION_HEART_DOWN: {
			name: "EXPLOSION_HEART_DOWN",
			particle: "particles",
			config: {
				...defaultConfig.EXPLOSION,
				frame: "heart",
				gravityY: 200,
			},
		},
		EXPLOSION_YELLOW: {
			name: "EXPLOSION_YELLOW",
			particle: "particles",
			config: {
				...defaultConfig.EXPLOSION,
				frame: "yellow",
			},
		},
		EXPLOSION_GREY: {
			name: "EXPLOSION_GREY",
			particle: "particles",
			config: {
				...defaultConfig.EXPLOSION,
				frame: "grey",
			},
		},
	}

	private scene: Phaser.Scene
	emitters: { [key: string]: Phaser.GameObjects.Particles.ParticleEmitter }
	follow: Base | Ball

	constructor(scene: Phaser.Scene, follow: Base | Ball) {
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
				this.emitters[key].visible = true
			})
		} else {
			this.emitters[key].active = true
			this.emitters[key].visible = true
		}

		return this
	}

	stop(key?: keyof emitter): this {
		const _stop = (key: keyof emitter) => {
			this.emitters[key].visible = false
			setTimeout(() => {
				this.emitters[key].active = false
			}, 1000)
		}

		if (!key) Object.keys(this.emitters).forEach((key) => _stop(key))
		else _stop(key)

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

		setTimeout(() => {
			this.stop(key)
		}, 1000)

		return this
	}
}
