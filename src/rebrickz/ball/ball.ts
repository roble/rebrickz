import { GameConfig as config } from "@config"
import { Emitters } from "@rebrickz/brick/emitters"

export enum BallType {
	NORMAL,
}

export enum BallState {
	RUNNING,
	STOPPED,
	ANIMATING,
}

abstract class Base extends Phaser.Physics.Arcade.Sprite {
	abstract ballType: BallType
	abstract criticalRate: number
	abstract instantKillRate: number
	emitters: Emitters
	state: BallState

	constructor(scene: Phaser.Scene, x: number, y: number, texture = "ball") {
		super(scene, x, y, texture)
		this.state = BallState.STOPPED
		this.emitters = new Emitters(scene, this)

		this.on("addedtoscene", this.onCreate, this)
	}

	private onCreate(): this {
		const { size } = config.ball

		this.displayWidth = size
		this.displayHeight = size
		this.enableCollision(true)
		this.createEmitters()

		return this
	}

	createEmitters(): this {
		this.emitters.create(Emitters.EMITTERS.NORMAL_BALL.name)
		this.emitters.stop()
		return this
	}

	private animate(args: object) {
		this.scene?.tweens.add({
			targets: [this],
			...args,
		})
	}

	enableCollision(value: boolean) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		this.body.onWorldBounds = value
	}

	afterMove() {
		this.state = BallState.STOPPED
		this.hide()
	}

	move(x: number, y: number): this {
		if (this.state !== BallState.STOPPED) {
			console.warn("The ball is not stopped to be moved")
			// return this
		}

		this.state = BallState.ANIMATING
		this.scene.time.addEvent({
			delay: Phaser.Math.Between(0, 300),
			callback: this.animate,
			callbackScope: this,
			args: [
				{
					alpha: 1,
					scale: 1,
					ease: config.ball.tweens.move.ease,
					duration: config.ball.tweens.move.duration,
					x: x ?? this.x,
					y: y ?? this.y,
					onComplete: this.afterMove,
					onCompleteScope: this,
				},
			],
		})

		return this
	}

	start(x: number, y?: number) {
		this.show()
		this.emitters.start()
		this.state = BallState.RUNNING
		this.setVelocity(x, y)
	}

	stop(): this {
		super.stop()
		this.emitters.stop()
		this.state = BallState.STOPPED
		this.setVelocity(0)
		return this
	}

	destroy(emit?: boolean): void {
		if (emit) {
			this.emitters.explode(20, 0, 0)
		}
		// destroy and remove from scene
		super.destroy(true)
	}

	hide() {
		this.visible = false
	}

	show() {
		this.visible = true
	}
}

export class Ball extends Base {
	criticalRate: number
	instantKillRate: number
	ballType!: BallType

	constructor(scene: Phaser.Scene, x: number, y: number) {
		super(scene, x, y)
		this.criticalRate = config.ball.criticalRate
		this.instantKillRate = config.ball.instantKillRate
	}
}
