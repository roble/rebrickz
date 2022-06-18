import { Ball, Balls, BallType, Brick, Bricks, BrickType, Trajectory, World, Lives } from "."

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
	private lives: Lives
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
		this.lives = new Lives(scene)
		this.level = 1
		this.collected = []

		this.create()
		this.addEventListeners()
	}

	create() {
		this.addFirstBall()
		this.bricks.createRandom(this.level)
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
			default:
				break
		}
	}

	restart() {
		this.gameOver = false
		this.state = GameState.WAITING_PLAYER
		this.level = 1
		this.bricks.restart()
		this.balls.restart()
		this.addFirstBall()
		this.trajectory.setPosition(this.world.getStartPosition().x)
		this.bricks.createRandom(this.level)
		this.lives.restart()
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
		this.state = GameState.WAITING_PLAYER

		const firstBall = this.balls.getFirstBall()
		this.trajectory.setPosition(firstBall.x)

		this.level++

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
			await this.bricks.createRandom(this.level)
		})

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
			if (this.state === GameState.RUNNING) this.nextRound()
		})
		/**
		 * On brick collided world's bottom
		 */
		this.bricks.on(Bricks.EVENTS.COLLIDED_WORLD_DOWN, () => {
			this.bricks.destroyRow(World.lastRowIndex)
			if (!this.lives.decrease()) {
				this.gameOver = true
				this.emit("gameover")
				this.restart()
			}
		})
		/**
		 * On brick has collected
		 */
		this.bricks.on(Bricks.EVENTS.COLLECTED, (brick: Brick) => {
			this.collected.push(brick)
			if (brick.brickType === BrickType.EXTRA_LIFE) {
				this.lives.increase()
			}
		})
		return this
	}
}
