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
	}

	show(): this {
		return this.fall()
	}

	createEmitters(): this {
		this.emitters.create(Emitters.EMITTERS.EXPLOSION_HEART_UP.name)
		this.emitters.create(Emitters.EMITTERS.HEART_UP.name, { offset: { y: 25 } })
		return this
	}

	destroy() {
		this.emitters.explode()
		super.destroy()
	}
}
