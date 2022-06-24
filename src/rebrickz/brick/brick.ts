import { World } from "@rebrickz"
import { Base, BrickOptions, BrickType } from "./base"
import { Health } from "./health"
import { Emitters } from "./emitters"

export class Brick extends Base {
	readonly brickType: BrickType

	health: Health
	emitters: Emitters

	constructor(scene: Phaser.Scene, options: BrickOptions) {
		super(scene, { ...options, frame: "monster/move/move-0" })
		this.brickType = BrickType.BRICK
		this.health = new Health(scene, this, options.level || 1)
		this.emitters = new Emitters(scene, this)
		this.createEmitters()
		this.addListeners()
		this.createAnimations()
		this.play("blink")
	}

	show(): this {
		return this.fall()
	}

	createEmitters(): this {
		this.emitters.create(Emitters.EMITTERS.EXPLOSION_YELLOW.name)
		return this
	}

	addListeners(): this {
		this.health.events.on(Health.EVENTS.DAMAGE, (damage: number) => {
			this.play("pain")
			this.emit(Health.EVENTS.DAMAGE, damage)
			if (this.row === World.lastRowIndex) this.playAfterDelay("angry", 500)
			else this.playAfterDelay("blink", 500)
		})

		this.health.events.on(Health.EVENTS.DIED, () => {
			this.body.enable = false
			this.setAlpha(0.75)
			this.play("die")
			setTimeout(() => {
				this.emitters.explode()
				this.destroy()
			}, 600)
		})

		this.on(Base.EVENTS.MOVE, () => {
			this.health.update()
		})

		this.on(Base.EVENTS.MOVE_START, () => {
			this.play("move")
		})

		this.on(Base.EVENTS.MOVE_END, () => {
			this.stop()
			this.play("blink")
		})

		this.on(Base.EVENTS.IN_LAST_ROW, () => {
			this.play("angry")
		})

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
				prefix: "monster/blink/blink-",
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
				prefix: "monster/move/move-",
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
				prefix: "monster/die/die-",
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
				end: 4,
				prefix: "monster/pain/pain-",
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
				prefix: "monster/angry/angry-",
			}),
			frameRate: 20,
			repeat: -1,
			repeatDelay: Phaser.Math.Between(200, 500),
		})

		/**
		 * Explosion
		 */
		this.anims.create({
			key: "explosion",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 8,
				prefix: "explosion/explosion-",
			}),
			frameRate: 30,
			repeat: 0,
		})
	}
}

export default {
	Brick,
	BrickType,
}
