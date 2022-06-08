export class Aim extends Phaser.Physics.Arcade.Sprite {
	speed = 200

	constructor(scene: Phaser.Scene, x: number, y: number) {
		super(scene, x, y, "aim")
	}

	start(x: number, y: number, direction: number) {
		this.body.reset(x, y)

		this.setActive(true)
		this.setVisible(true)

		this.setVelocity(this.speed * Math.cos(direction), this.speed * Math.sin(direction))
	}

	preUpdate(time: number, delta: number) {
		super.preUpdate(time, delta)

		if (this.y <= -32 || this.x <= -32 || this.x > 332) {
			this.setActive(false)
			this.setVisible(false)
		}
	}
}

export class AimTrajectory extends Phaser.Physics.Arcade.Group {
	constructor(scene: Phaser.Scene) {
		super(scene.physics.world, scene)

		this.createMultiple({
			frameQuantity: 200,
			key: "aim",
			active: false,
			visible: false,
			classType: Aim,
		})

		this.world.setBoundsCollision()
	}

	start(x: number, y: number, direction: number) {
		let aim = this.getFirstDead(false)

		if (aim) {
			aim.start(x, y, direction)
		}
	}
}
