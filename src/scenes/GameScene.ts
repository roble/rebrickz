import { GameConfig as config } from "@config"
import { Health } from "@rebrickz/brick/health"
import { Level } from "@rebrickz/level"
import { MaxScore } from "@rebrickz/max-score"
import { Score } from "@rebrickz/score"
import { Ball, Balls, BallType, Brick, Bricks, BrickType, Lives, Trajectory, World } from "../rebrickz"

export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
	PREPARING_NEXT_ROUND,
	GAME_OVER,
}

export class GameScene extends Phaser.Scene {
	private world!: World
	private trajectory!: Trajectory
	private balls!: Balls
	private bricks!: Bricks
	private lives!: Lives
	private state!: GameState
	private collected!: Brick[]
	private level!: Level
	private score!: Score
	private maxScore!: MaxScore

	constructor() {
		super({ key: "GameScene", active: false })
	}

	async create() {
		this.state = GameState.WAITING_PLAYER
		this.world = new World(this)
		this.trajectory = new Trajectory(this, this.world)
		this.balls = new Balls(this)
		this.bricks = new Bricks(this, this.balls)
		// top panel
		const worldLeft = this.world.getBounds().left
		this.score = new Score(this, worldLeft, 10)
		this.maxScore = new MaxScore(this, worldLeft, 30)
		this.level = new Level(this, worldLeft, 50)
		this.lives = new Lives(this, worldLeft, 75)
		this.collected = []

		this.addBalls()
		this.trajectory.setCollidableLines(this.world.getCollidableLines())
		this.trajectory.setActive(true)
		this.bricks.createRandom(this.level.getValue())

		this.addEventListeners()

		// this.tweens.timeScale = 2; // tweens
		// this.physics.world.timeScale = 0.5; // physics
		// this.time.timeScale = 2; // time events
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
			case GameState.PREPARING_NEXT_ROUND: {
				this.nextRound()
				break
			}
			default:
				break
		}
	}

	private addBalls(): this {
		const position = this.world.getStartPosition()

		for (let i = 0; i < config.ball.startBalls; i++) {
			this.balls.add(BallType.NORMAL, position.x, position.y)
		}

		return this
	}

	private fireBalls(direction: number): this {
		this.state = GameState.RUNNING
		this.balls.fire(direction)
		return this
	}

	private async nextRound(): Promise<this> {
		this.state = GameState.UPDATING

		const firstBall = this.balls.getFirstBall()
		this.trajectory.setPosition(firstBall.x)

		this.level.increase(1)

		const gameOver = await this.bricks.move().then(() => {
			if (this.state === GameState.GAME_OVER) return true
		})

		if (gameOver) return this

		await this.bricks.createRandom(this.level.getValue())

		this.collected.forEach((brick) => {
			switch (brick.brickType) {
				case BrickType.SPECIAL_BALL:
				case BrickType.EXTRA_BALL: {
					const ball = this.balls.add(BallType.NORMAL, firstBall.x, firstBall.y - 1)
					ball.hide()
					break
				}

				default:
					break
			}
		})

		this.collected = []

		this.state = GameState.WAITING_PLAYER

		return this
	}

	private addEventListeners(): this {
		this.trajectory.events.on(Trajectory.EVENTS.FIRE, this.fireBalls, this)
		/**
		 * Handle balls collision
		 */
		this.world.events.on(World.EVENTS.BALL_COLLIDED, (ball: { gameObject: Ball }) => {
			this.balls.collideWorldBottom(ball.gameObject)
		})
		/**
		 * Handle all balls stopped running
		 */
		this.balls.events.on(Balls.EVENTS.BALLS_STOPPED, () => {
			this.state = GameState.PREPARING_NEXT_ROUND
		})
		/**
		 * On brick collided world's bottom
		 */
		this.bricks.events.on(Bricks.EVENTS.COLLIDED_WORLD_DOWN, () => {
			this.bricks.destroyRow(World.lastRowIndex)
			if (!this.lives.decrease()) {
				this.state = GameState.GAME_OVER
				this.scene.launch("GameOverScene")
			}
		})
		/**
		 * On brick has collected
		 */
		this.bricks.events.on(Bricks.EVENTS.COLLECTED, (brick: Brick) => {
			switch (brick.brickType) {
				case BrickType.EXTRA_LIFE:
					this.lives.animateIncrease(brick.x, brick.y - brick.width / 2)
					break
				default:
					this.collected.push(brick)
					break
			}
		})
		/**
		 * Event listeners for brick health
		 */
		this.bricks.events.on(Health.EVENTS.DAMAGE, (damage: number) => {
			this.score.increase(damage)
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
