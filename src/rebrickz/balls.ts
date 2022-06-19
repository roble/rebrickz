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
	ballsLanded: number
	fireOrigin: Phaser.Geom.Point | undefined
	totalBallsText!: Phaser.GameObjects.Text

	constructor(scene: Phaser.Scene) {
		super()
		this.scene = scene
		this.firstBallToLand = undefined
		this.ballsLanded = 0
		this.fireOrigin = undefined
		this.createGroup(scene)
		this.createText()
	}

	createCallback(obj: Phaser.GameObjects.GameObject) {
		this.updateText(this.group.getLength())
		return obj //TODO: remove
	}

	removeCallback(obj: Phaser.GameObjects.GameObject) {
		return obj //TODO: remove
	}

	private updateText(total: number) {
		if (total < 2) {
			this.hideText()
			return
		}
		this.showText()
		this.totalBallsText.setText(`x${total}`)
	}

	private createText() {
		this.totalBallsText = this.scene.add.text(-100, -100, "x1")
		this.totalBallsText.setFontFamily("Arial Black").setOrigin(0.5).setFontSize(12)
	}

	private showText() {
		this.scene.tweens.add({
			targets: this.totalBallsText,
			alpha: 1,
			duration: 200,
			ease: "Linear",
		})
	}

	private hideText() {
		this.scene.tweens.add({
			targets: this.totalBallsText,
			alpha: 0,
			duration: 200,
			ease: "Linear",
		})
	}

	restart() {
		this.group.destroy(true)
		this.createGroup(this.scene)
		// this.group.getChildren().forEach(e => {
		// 	e.destroy(true)
		// 	this.group.remove(e, true)
		// })
		this.updateText(0)
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

		this.fireOrigin = new Phaser.Geom.Point(firstBall.x, firstBall.y)
		this.group.balls.forEach((ball, index) => {
			this.scene.time.addEvent({
				delay: delayBetweenBalls * index,
				callback: () => {
					ball.start(speed * Math.cos(direction), speed * Math.sin(direction))
					this.updateText(this.group.getLength() - (index + 1))
				},
			})
		})
	}

	collideWorldBottom(ball: Ball) {
		ball.stop()
		this.ballsLanded++

		if (!this.firstBallToLand) this.firstBallToLand = ball

		if (ball != this.firstBallToLand) this.moveToTheFirstBallPosition(ball)

		if (this.ballsLanded === this.group.getLength()) {
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

		this.totalBallsText.setPosition(this.getFirstBall().x, this.getFirstBall().y + config.ball.size + 10)
		this.updateText(this.group.getLength())
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
