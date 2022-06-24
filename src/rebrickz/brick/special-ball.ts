import { BrickType } from ".."
import { Base, BrickOptions } from "./base"
import { Emitters } from "./emitters"

export class SpecialBall extends Base {
	readonly brickType: BrickType

	emitters: Emitters

	constructor(scene: Phaser.Scene, options: BrickOptions) {
		super(scene, { ...options, texture: "special_ball" })
		this.brickType = BrickType.SPECIAL_BALL
		this.emitters = new Emitters(scene, this)
		this.createEmitters()
	}

	show(): this {
		return this.fall()
	}

	createEmitters(): this {
		this.emitters.create(Emitters.EMITTERS.EXPLOSION_GREEN.name)
		return this
	}

	destroy() {
		this.emitters.explode()
		super.destroy()
	}
}
