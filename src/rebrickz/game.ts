import { Ball, Balls, BallType, Bricks, Trajectory, World } from "."

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

		this.create()
	}

	create() {
		this.addEventListeners()
		this.addFirstBall()
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
		const firstBallPosition = this.balls.getFirstBall().x
		this.trajectory.setPosition(firstBallPosition)
		console.time("move")
		await this.bricks.move()

		await this.bricks.createRandom()

		console.timeEnd("move")

		this.state = GameState.WAITING_PLAYER

		return this
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
			this.nextRound()
		})
		return this
	}
}
