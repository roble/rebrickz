import { Ball, Balls, BallType, Brick, Bricks, BrickType, Trajectory, World } from "."

export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
	ANIMATING,
}

export class Game extends Phaser.Events.EventEmitter {
	private world: World
	private trajectory: Trajectory
	private balls: Balls
	private bricks: Bricks
	private state: GameState
	private scene: Phaser.Scene
	private gameOver: boolean
	private level: number
	private collected: Brick[]

	constructor(scene: Phaser.Scene) {
		super()

		this.scene = scene
		this.state = GameState.WAITING_PLAYER
		this.gameOver = false
		this.world = new World(scene)
		this.trajectory = new Trajectory(scene, this.world)
		this.balls = new Balls(scene)
		this.bricks = new Bricks(scene, this.balls)
		this.level = 1
		this.collected = []

		this.create()
	}

	create() {
		this.addEventListeners()
		// for (let i = 0; i < 50; i++) {
		this.addFirstBall()
		// }
		this.bricks.createRandom()
		this.trajectory.setCollidableLines(this.world.getCollidableLines())
		this.trajectory.setActive(true)
	}

	update() {
		switch (this.state) {
			case GameState.RUNNING: {
				this.bricks.setCollisionHandler()
				this.trajectory.setActive(false)
				break
			}
			case GameState.WAITING_PLAYER: {
				this.trajectory.setCollidableLines([...this.world.getCollidableLines(), ...this.bricks.getCollidableLines()])
				this.trajectory.setActive(true)
				break
			}
			// case GameState.UPDATING: {
			//     this.state = GameState.ANIMATING
			//     this.bricks.createRandom()
			//     this.bricks.move()
			//     this.bricks.updateSlots()
			//     this.scene.time.addEvent({
			//         delay: 500, callback: () => {
			//             this.state = GameState.WAITING_PLAYER
			//         }
			//     })
			//     break
			// }
			default:
				break
		}
	}

	private addFirstBall(): this {
		const position = this.world.getStartPosition()
		this.balls.add(BallType.NORMAL, position.x, position.y)
		return this
	}

	private fireBalls(direction: number): this {
		this.state = GameState.RUNNING
		this.balls.fire(direction)
		return this
	}

	private async nextRound(): Promise<this> {
		console.log("NEXT ROUND!")

		const firstBall = this.balls.getFirstBall()
		this.trajectory.setPosition(firstBall.x)

		this.collected.forEach((brick) => {
			switch (brick.brickType) {
				case BrickType.SPECIAL_BALL:
				case BrickType.EXTRA_BALL: {
					const ball = this.balls.add(BallType.NORMAL, firstBall.x, firstBall.y)
					ball.hide()
					break
				}

				default:
					break
			}
		})

		await this.bricks.move().then(async () => {
			await this.bricks.createRandom()
		})

		this.state = GameState.WAITING_PLAYER
		this.collected = []

		return new Promise((resolve) => {
			return resolve(this)
		})
	}

	private addEventListeners(): this {
		this.trajectory.on(Trajectory.EVENTS.FIRE, this.fireBalls, this)
		/**
		 * Handle balls collision
		 */
		this.world.on(World.EVENTS.BALL_COLLIDED, (ball: { gameObject: Ball }) => {
			this.balls.collideWorldBottom(ball.gameObject)
		})
		/**
		 * Handle all balls stopped running
		 */
		this.balls.on(Balls.EVENTS.BALLS_STOPPED, () => {
			console.warn("BALLS STOPPED")
			this.nextRound()
		})
		/**
		 * On brick collided world's bottom
		 */
		this.bricks.on(Bricks.EVENTS.COLLIDED_WORLD_DOWN, () => {
			console.log("COLLIDED_WORLD_DOWN")
			this.bricks.destroyRow(World.lastRowIndex)
		})
		/**
		 * On brick has collected
		 */
		this.bricks.on(Bricks.EVENTS.COLLECTED, (brick: Brick) => {
			console.warn("COLLECTED", brick)
			this.collected.push(brick)
		})
		return this
	}
}
