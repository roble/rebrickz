import { World } from "."
import { Base } from "./brick/base"
import { Health } from "./brick/health"
import { Moveable } from "./brick/moveable"

export interface BlockOptions {
	texture?: string
	row: number
	col: number
	level?: number
	frame?: string | number | undefined
}

export enum BrickType {
	BRICK,
	SPECIAL_BALL,
	EXTRA_BALL,
	EXTRA_LIFE,
}

export class Brick extends Base {
	readonly brickType: BrickType

	health: Health

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, frame: "move-0.png" })
		this.brickType = BrickType.BRICK
		this.health = new Health(scene, this, options.level || 1)
		this.addListeners()
		this.createAnimations()
		this.play("blink")
	}

	addListeners(): this {
		this.health.on(Health.EVENTS.DAMAGE, (damage: number) => {
			this.play("pain")
			this.emit(Health.EVENTS.DAMAGE, damage)
			if (this.row === World.lastRowIndex) this.playAfterDelay("angry", 500)
			else this.playAfterDelay("blink", 500)
		})

		this.health.on(Health.EVENTS.DIED, () => {
			this.body.enable = false
			this.setAlpha(0.75)
			this.play("die")
			setTimeout(() => {
				this.destroy()
			}, 600)
		})

		this.on(Moveable.EVENTS.MOVE, () => {
			this.health.update()
		})

		this.on(Moveable.EVENTS.MOVE_START, () => {
			this.play("move")
		})

		this.on(Moveable.EVENTS.MOVE_END, () => {
			this.stop()
			this.play("blink")
		})

		this.on(Moveable.EVENTS.IN_LAST_ROW, () => {
			this.play("angry")
		})

		this.on("destroy", this.health.destroy, this)

		return this
	}

	private createAnimations() {
		/**
		 * Blink
		 */
		this.anims.create({
			key: "blink",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 8,
				prefix: "blink-",
				suffix: ".png",
			}),
			frameRate: 30,
			repeat: -1,
			repeatDelay: Phaser.Math.Between(1000, 5000),
		})
		/**
		 * Move
		 */
		this.anims.create({
			key: "move",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 7,
				prefix: "move-",
				suffix: ".png",
			}),
			frameRate: 10,
			repeat: -1,
		})
		/**
		 * Die
		 */
		this.anims.create({
			key: "die",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 5,
				prefix: "die-",
				suffix: ".png",
			}),
			frameRate: 20,
			repeat: 0,
		})

		/**
		 * Pain
		 */
		this.anims.create({
			key: "pain",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 6,
				prefix: "pain-",
				suffix: ".png",
			}),
			frameRate: 30,
			repeat: 0,
		})

		/**
		 * Angry
		 */
		this.anims.create({
			key: "angry",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 8,
				prefix: "angry-",
				suffix: ".png",
			}),
			frameRate: 20,
			repeat: -1,
			repeatDelay: Phaser.Math.Between(200, 500),
		})
	}
}

export class SpecialBall extends Base {
	readonly brickType: BrickType

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "special_ball" })
		this.brickType = BrickType.SPECIAL_BALL
	}
}

export class ExtraBall extends Base {
	readonly brickType: BrickType

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "extra_ball" })
		this.brickType = BrickType.EXTRA_BALL
	}
}

export class ExtraLife extends Base {
	readonly brickType: BrickType

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "life" })
		this.brickType = BrickType.EXTRA_LIFE
	}
}

export default {
	Brick,
	SpecialBall,
	ExtraBall,
	ExtraLife,
	BrickType,
}
