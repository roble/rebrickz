import Phaser from "phaser"
import { GameConfig as config } from "@config"
import { Ball, BallState } from "@objects/Ball"
import { MainScene } from "@scenes/MainScene"

export class Balls extends Phaser.Physics.Arcade.Group {
	constructor(scene: MainScene) {
		super(scene.physics.world, scene, {
			bounceX: 1,
			bounceY: 1,
			classType: Ball,
			collideWorldBounds: true,
			maxSize: config.ball.max,
		})
	}

	fire(direction: number) {
		const balls = this.getChildren() as Ball[]
		const { speed, delayBetweenBalls } = config.ball

		balls.forEach((ball, index) => {
			this.scene.time.addEvent({
				delay: delayBetweenBalls * index,
				callback: () => {
					ball.start(speed * Math.cos(direction), speed * Math.sin(direction))
				},
			})
		})
	}

	regroup() {}

	isRunning(): boolean {
		const children = this.getChildren() as Ball[]

		return children.some((ball) => ball.state === BallState.RUNNING)
	}

	getFirstBall(): Ball {
		return this.getChildren()[0] as Ball
	}
}
