import { BallConfigType, GameConfig as config } from "@config"
import { MainScene } from "@scenes/MainScene"

/**
 * BallType
 */
export enum BallType {
	NORMAL,
}

export enum BallState {
	RUNNING,
	STOPPED,
}

export class Ball extends Phaser.Physics.Arcade.Sprite {
	protected _emitter!: Phaser.GameObjects.Particles.ParticleEmitter
	protected _particle!: Phaser.GameObjects.Particles.ParticleEmitterManager

	config: BallConfigType
	state: BallState
	size: number
	isCircle = false

	constructor(scene: MainScene) {
		super(scene, 0, 0, "ball")

		this.config = config.ball
		this.state = BallState.STOPPED
		this.size = config.ball.size
		this.createEmitter()
		this.init()
	}

	init() {
		const { size, radius } = this.config
		this.displayWidth = size
		this.displayHeight = size

		this.on(
			"addedtoscene",
			() => {
				if (this.isCircle) this.body?.setCircle(radius)
			},
			this
		)
	}

	start(x: number, y?: number) {
		this._emitter.active = true
		this._emitter.visible = true
		this.state = BallState.RUNNING
		this.setVelocity(x, y)
	}

	stop(): this {
		super.stop()
		this._emitter.active = false
		this._emitter.visible = false
		this.state = BallState.STOPPED
		this.setVelocity(0)
		return this
	}

	move(x?: number, y?: number) {
		this.animateMove(x, y)
	}

	private createEmitter() {
		this._particle = this.scene.add.particles("ball")
		this._emitter = this._particle.createEmitter({
			x: this.x,
			y: this.y,
			// angle: 0,
			speed: { min: 50, max: 0 },
			gravityY: 0,
			gravityX: 0,
			scale: { start: 0.3, end: 0.0 },
			active: false,
			lifespan: 300,
			// blendMode: "ADD",
		})
		this._emitter.startFollow(this)
	}

	private animateMove(x?: number, y?: number): Promise<string> {
		return new Promise((resolve, reject) => {
			this.scene.time.addEvent({
				delay: Phaser.Math.Between(0, 300),
				callback: this.animate,
				callbackScope: this,
				args: [
					{
						alpha: 1,
						scale: 1,
						ease: "Quart.easeOut",
						duration: 500,
						x: x ?? this.x,
						y: y ?? this.y,
						callback: resolve,
					},
				],
			})
		})
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
}
