import { World } from "@rebrickz"
import { Base, BrickOptions, BrickType } from "./base"
import { Health } from "./health"
import { Emitters } from "./emitters"
import { GameConfig as config } from "@config"

export class Brick extends Base {
	readonly brickType: BrickType

	health: Health
	emitters: Emitters
	lastAnimation!: string | Phaser.Animations.Animation | Phaser.Types.Animations.PlayAnimationConfig

	constructor(scene: Phaser.Scene, options: BrickOptions) {
		super(scene, { ...options, frame: "monster/green/move-0" })
		this.brickType = BrickType.BRICK
		this.health = new Health(scene, this, options.level || 1)
		this.emitters = new Emitters(scene, this)
		this.createEmitters()
		this.addListeners()
		this.createAnimations()
		this.lastAnimation = ""
		this.play("blink")
	}

	play(
		key: string | Phaser.Animations.Animation | Phaser.Types.Animations.PlayAnimationConfig,
		ignoreIfPlaying?: boolean | undefined
	): this {
		this.lastAnimation = key
		return super.play(key, ignoreIfPlaying)
	}

	playAndRestore(
		key: string | Phaser.Animations.Animation | Phaser.Types.Animations.PlayAnimationConfig,
		delay = 500,
		ignoreIfPlaying?: boolean | undefined
	): this {
		this.play(key, ignoreIfPlaying)
		if (this.lastAnimation) this.playAfterDelay(this.lastAnimation, delay)

		return this
	}

	show(): this {
		return this.fall()
	}

	attack(): this {
		const args = {
			alpha: 1,
			scale: 1,
			ease: "Power3",
			duration: 600,
			y: config.height + config.brick.size,
			onComplete: () => {
				this.destroy()
			},
			onCompleteContext: this,
		}
		this.animate(args, true)
		return this
	}

	createEmitters(): this {
		this.emitters.create(Emitters.EMITTERS.EXPLOSION_GREY.name)
		return this
	}

	addListeners(): this {
		this.health.events.on(Health.EVENTS.DAMAGE, (damage: number) => {
			this.play("pain")
			this.emit(Health.EVENTS.DAMAGE, damage)

			if (this.row === World.lastRowIndex) this.playAfterDelay("angry", 500)
			else {
				if (this.health.isHealthLow()) this.playAfterDelay("tired", 500)
				else this.playAfterDelay("blink", 500)
			}
		})

		this.health.events.on(Health.EVENTS.DIED, () => {
			this.body.enable = false
			this.setAlpha(0.95)
			this.play("die", true)
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
			if (this.health.isHealthLow()) this.playAfterDelay("tired", 500)
			else this.playAfterDelay("blink", 500)
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
				end: 4,
				prefix: "monster/green/blink-",
			}),
			frameRate: 10,
			repeat: -1,
			repeatDelay: Phaser.Math.Between(3000, 5000),
		})
		/**
		 * Move
		 */
		this.anims.create({
			key: "move",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 5,
				prefix: "monster/green/move-",
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
				end: 4,
				prefix: "monster/green/die-",
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
				end: 3,
				prefix: "monster/green/pain-",
			}),
			frameRate: 20,
			repeat: 0,
		})

		/**
		 * Angry
		 */
		this.anims.create({
			key: "angry",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 6,
				prefix: "monster/green/angry-",
			}),
			frameRate: 15,
			// yoyo: true,
			repeat: -1,
			repeatDelay: Phaser.Math.Between(200, 500),
		})

		/**
		 * Tired
		 */
		this.anims.create({
			key: "tired",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 4,
				prefix: "monster/green/tired-",
			}),
			frameRate: 7,
			repeat: -1,
			repeatDelay: 300,
		})
	}
}

export default {
	Brick,
	BrickType,
}
