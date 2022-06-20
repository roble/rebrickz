import { GameConfig as config } from "@config"
import { BlockOptions } from "@rebrickz/brick"

import { BrickType, Position, World } from ".."
import { Moveable } from "./moveable"

export abstract class Base extends Moveable {
	abstract brickType: BrickType
	emitter!: Phaser.GameObjects.Particles.ParticleEmitter

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		const { row, col, texture = "monster-yellow", frame = undefined } = options
		super(scene, 0, 0, texture, frame)
		this.fixPosition(row, col)
		this.on("addedtoscene", this.onCreate, this)
	}

	private onCreate(): this {
		const { initialAlpha, initialDepth, initialScale } = config.brick
		this.setScale(initialScale)
		this.setAlpha(initialAlpha)
		this.setDepth(initialDepth)
		this.createEmitter()
		this.fall()
		return this
	}

	private fixPosition(row: number, col: number) {
		this.setOrigin(0.5, 0)
		this.row = World.isValidRow(row) ? row : 0
		this.col = World.isValidCol(col) ? col : 0

		this.x = Position.getXByCol(this.col)
		this.y = Position.getYByRow(this.row)
	}

	createEmitter(): this {
		this.emitter = this.scene.add.particles("ground_tile").createEmitter({
			x: this.x,
			y: this.y,
			gravityY: 100,
			scale: {
				start: 0.2,
				end: 0,
			},
			speed: {
				min: 50,
				max: 100,
			},
			alpha: {
				min: 0.25,
				max: 0.75,
			},
			active: false,
			lifespan: 1000,
			quantity: 150,
			blendMode: Phaser.BlendModes.COLOR_DODGE,
		})
		this.emitter.startFollow(this)
		return this
	}

	destroy(): void {
		this.emitter.active = true
		this.emitter.explode(20, 0, 0)

		if (this.followPosition.length) {
			this.followPosition.forEach((e) => {
				if (e && e.destroy) e.destroy()
			})
		}

		// destroy and remove from scene
		super.destroy(true)
	}
}
