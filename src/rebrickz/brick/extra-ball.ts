import { BrickType } from ".."
import { Base, BrickOptions } from "./base"
import { Emitters } from "./emitters"

export class ExtraBall extends Base {
	readonly brickType: BrickType

	emitters: Emitters

	constructor(scene: Phaser.Scene, options: BrickOptions) {
		super(scene, { ...options, texture: "extra_ball" })
		this.brickType = BrickType.EXTRA_BALL
		this.emitters = new Emitters(scene, this)
		this.createEmitters()
	}

	show(): this {
		return this.fall()
	}

	createEmitters(): this {
		this.emitters.create(Emitters.EMITTERS.EXPLOSION_GREEN.name)
		this.emitters.create(Emitters.EMITTERS.GREEN_UP.name, { offset: { y: 25 } })
		return this
	}

	destroy() {
		this.emitters.explode()
		super.destroy()
	}
}
