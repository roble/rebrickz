import { GameConfig as config } from "@config"
import { Ball, BallState, BallType } from "./ball"
import { BallsGroup } from "./balls-group"

export class Balls {
	private scene: Phaser.Scene
	group!: BallsGroup

	constructor(scene: Phaser.Scene) {
		this.scene = scene
		this.createGroup(scene)
	}

	createCallback(obj: Phaser.GameObjects.GameObject) {
		return obj //TODO: remove
	}

	removeCallback(obj: Phaser.GameObjects.GameObject) {
		return obj //TODO: remove
	}

	add(type: BallType, x: number, y: number): this {
		switch (type) {
			case BallType.NORMAL:
				this.group.add(new Ball(this.scene, x, y), true)
				break
			default:
				console.warn("Unknown block type ")
				break
		}
		return this
	}

	isRunning(): boolean {
		return this.group.balls.some((ball) => ball.state === BallState.RUNNING)
	}

	fire(direction: number): void {
		const { speed, delayBetweenBalls } = config.ball

		this.group.balls.forEach((ball, index) => {
			this.scene.time.addEvent({
				delay: delayBetweenBalls * index,
				callback: () => {
					ball.start(speed * Math.cos(direction), speed * Math.sin(direction))
				},
			})
		})
	}

	getFirstBall(): Ball {
		return this.group.balls[0]
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
			maxSize: config.block.max.normal,
			...callbacks,
		})

		return this
	}
}
