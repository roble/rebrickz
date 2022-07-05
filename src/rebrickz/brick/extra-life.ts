import { BrickType } from ".."
import { Base, BrickOptions } from "./base"
import { Emitters } from "./emitters"

export class ExtraLife extends Base {
	readonly brickType: BrickType

	emitters: Emitters

	constructor(scene: Phaser.Scene, options: BrickOptions) {
		super(scene, { ...options, texture: "life" })
		this.brickType = BrickType.EXTRA_LIFE
		this.emitters = new Emitters(scene, this)
		this.createEmitters()
		this.createAnimations()
	}

	show(): this {
		this.play("rotate")
		return this.fall()
	}

	createEmitters(): this {
		this.emitters.create(Emitters.EMITTERS.EXPLOSION_HEART_UP.name)
		this.emitters.create(Emitters.EMITTERS.HEART_UP.name, { offset: { y: 25 } })
		return this
	}

	private createAnimations() {
		/**
		 * Rotate
		 */
		this.anims.create({
			key: "rotate",
			frames: this.scene.anims.generateFrameNames(this.texture.key, {
				start: 0,
				end: 5,
				prefix: "life/rotate-",
			}),
			frameRate: 10,
			repeat: -1,
		})
	}

	destroy() {
		this.emitters.explode()
		super.destroy()
	}
}
