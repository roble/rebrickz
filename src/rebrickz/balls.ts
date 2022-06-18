import { GameConfig as config } from "@config"
import { Ball, BallType } from "./ball"
import { BallsGroup } from "./balls-group"

export class Balls extends Phaser.Events.EventEmitter {
	static readonly EVENTS = {
		BALLS_STOPPED: "balls_stopped",
	}

	private scene: Phaser.Scene
	group!: BallsGroup
	firstBallToLand: Ball | undefined
	ballsTotal: number
	ballsLanded: number
	fireOrigin: Phaser.Geom.Point | undefined
	totalBallsText!: Phaser.GameObjects.Text

	constructor(scene: Phaser.Scene) {
		super()
		this.scene = scene
		this.firstBallToLand = undefined
		this.ballsTotal = 0
		this.ballsLanded = 0
		this.fireOrigin = undefined
		this.createGroup(scene)
		this.createText()
	}

	createCallback(obj: Phaser.GameObjects.GameObject) {
		this.ballsTotal = this.group.getLength()
		this.updateText()
		return obj //TODO: remove
	}

	removeCallback(obj: Phaser.GameObjects.GameObject) {
		this.ballsTotal = this.group.getLength()
		return obj //TODO: remove
	}

	private updateText() {
		const { x, y } = this.getFirstBall()
		this.totalBallsText.setText(`x${this.ballsTotal}`)
		this.totalBallsText.setPosition(x, y + config.ball.size + 10)
	}

	private createText() {
		this.totalBallsText = this.scene.add.text(-100, -100, "x1")
		this.totalBallsText.setOrigin(0.5)
	}

	add(type: BallType, x: number, y: number): Ball {
		switch (type) {
			case BallType.NORMAL: {
				const ball = new Ball(this.scene, x, y)
				this.group.add(ball, true)
				return ball
			}
			default:
				throw new Error("Unknown block type")
		}
	}

	fire(direction: number): void {
		const { speed, delayBetweenBalls } = config.ball
		const firstBall = this.getFirstBall()
		this.firstBallToLand = undefined
		this.ballsLanded = 0
		this.ballsTotal = this.group.getLength()

		this.fireOrigin = new Phaser.Geom.Point(firstBall.x, firstBall.y)
		this.group.balls.forEach((ball, index) => {
			this.scene.time.addEvent({
				delay: delayBetweenBalls * index,
				callback: () => {
					ball.start(speed * Math.cos(direction), speed * Math.sin(direction))
				},
			})
		})
	}

	collideWorldBottom(ball: Ball) {
		ball.stop()
		this.ballsLanded++

		if (!this.firstBallToLand) this.firstBallToLand = ball

		if (ball != this.firstBallToLand) this.moveToTheFirstBallPosition(ball)

		this.updateText()

		if (this.ballsLanded === this.ballsTotal) {
			this.scene.time.addEvent({
				delay: 500,
				callback: this.emitBallsStopped,
				callbackScope: this,
			})
		}
	}

	private emitBallsStopped() {
		this.emit(Balls.EVENTS.BALLS_STOPPED)
		this.ballsLanded = 0
		this.ballsTotal = this.group.getLength()
	}

	moveToTheFirstBallPosition(ball: Ball): this {
		const { x, y } = this.getFirstBall()
		ball.move(x, y)

		return this
	}

	getFirstBall(): Ball {
		return this.firstBallToLand ? this.firstBallToLand : this.group.balls[0]
	}

	private createGroup(scene: Phaser.Scene): this {
		const callbacks = {
			createCallback: (obj: Phaser.GameObjects.GameObject) => {
				this.createCallback(obj)
			},
			removeCallback: (obj: Phaser.GameObjects.GameObject) => {
				this.createCallback(obj)
			},
		}

		this.group = new BallsGroup(scene, {
			bounceX: 1,
			bounceY: 1,
			classType: Ball,
			collideWorldBounds: true,
			maxSize: config.ball.max,
			...callbacks,
		})

		return this
	}
}
