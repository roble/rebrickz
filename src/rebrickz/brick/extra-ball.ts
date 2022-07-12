import { BrickType } from ".."
import { Base, BrickOptions } from "./base"
import { Emitters } from "./emitters"

export class ExtraBall extends Base {
	readonly brickType: BrickType

	emitters: Emitters

	constructor(scene: Phaser.Scene, options: BrickOptions) {
		super(scene, { ...options, texture: "extra-ball" })
		this.brickType = BrickType.EXTRA_BALL
		this.emitters = new Emitters(scene, this)
		this.createEmitters()
		this.createAnimations()
	}

	show(): this {
		this.play("float")
		return this.fall()
	}

	createEmitters(): this {
		this.emitters.create(Emitters.EMITTERS.EXPLOSION_LIGHT_GREEN.name)
		return this
	}

	private createAnimations() {
		/**
		 * Rotate
		 */
		this.anims.create({
			key: "float",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 4,
				prefix: "extra-ball/float-",
			}),
			yoyo: true,
			frameRate: 10,
			repeat: -1,
			repeatDelay: 4000,
		})
	}

	destroy() {
		this.emitters.explode()
		super.destroy()
	}
}
