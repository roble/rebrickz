import { GameConfig as config } from "@config"

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
	emitter!: Phaser.GameObjects.Particles.ParticleEmitter
	particle!: Phaser.GameObjects.Particles.ParticleEmitterManager
	state: BallState

	constructor(scene: Phaser.Scene, x: number, y: number, texture = "ball") {
		super(scene, x, y, texture)
		this.state = BallState.STOPPED
		this.on("addedtoscene", this.onCreate, this)
	}

	private onCreate(): this {
		const { size } = config.ball

		this.displayWidth = size
		this.displayHeight = size
		this.enableCollision(true)
		this.createEmitter()
		return this
	}

	private createEmitter() {
		this.particle = this.scene.add.particles("ball")
		this.emitter = this.particle.createEmitter({
			x: this.x,
			y: this.y,
			speed: { min: 40, max: 0 },
			gravityY: 0,
			gravityX: 0,
			scale: { start: 0.8, end: 0.0 },
			alpha: { start: 0.3, end: 0.0 },
			lifespan: 100,
		})
		this.emitter.startFollow(this)
		this.emitter.stop()
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
			return this
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
					ease: "Quart.easeOut",
					duration: 500,
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
		this.emitter.start()
		this.state = BallState.RUNNING
		this.setVelocity(x, y)
	}

	stop(): this {
		super.stop()
		this.emitter.stop()
		this.state = BallState.STOPPED
		this.setVelocity(0)
		return this
	}

	destroy(emit?: boolean): void {
		if (emit) {
			this.emitter.active = true
			this.emitter.explode(20, 0, 0)
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
	ballType!: BallType
}
