import { Ball, Balls, BallType, Brick, Bricks, BrickType, Lives, Trajectory, World } from "../rebrickz"

export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
	GAME_OVER,
}

export class GameScene extends Phaser.Scene {
	private world!: World
	private trajectory!: Trajectory
	private balls!: Balls
	private bricks!: Bricks
	private lives!: Lives
	private state!: GameState
	private level!: number
	private collected!: Brick[]

	constructor() {
		super({ key: "GameScene", active: false })
	}

	create() {
		this.state = GameState.WAITING_PLAYER
		this.world = new World(this)
		this.trajectory = new Trajectory(this, this.world)
		this.balls = new Balls(this)
		this.bricks = new Bricks(this, this.balls)
		this.lives = new Lives(this)
		this.level = 1
		this.collected = []
		this.addEventListeners()

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

		await this.bricks.move().then(async () => {
			if (this.state === GameState.GAME_OVER) return this
			await this.bricks.createRandom(this.level)

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
				this.state = GameState.GAME_OVER
				this.scene.launch("GameOverScene")
			}
		})
		/**
		 * On brick has collected
		 */
		this.bricks.on(Bricks.EVENTS.COLLECTED, (brick: Brick) => {
			this.collected.push(brick)
			if (brick.brickType === BrickType.EXTRA_LIFE) {
				this.lives.animateIncrease(brick.x, brick.y)
			}
		})
		/**
		 * Event listeners for lives
		 */
		this.lives.events.on(Lives.EVENTS.INCREASE, () => {
			console.log("lives increased")
		})
		this.lives.events.on(Lives.EVENTS.DECREASE, () => {
			console.log("lives decreased")
		})

		return this
	}
}
