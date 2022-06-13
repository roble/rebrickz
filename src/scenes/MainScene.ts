import { GameConfig as config } from "@config"
import * as Rebrickz from "@rebrickz"

export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
}

export class MainScene extends Phaser.Scene {
	private world!: Rebrickz.World
	private trajectory!: Rebrickz.Trajectory
	private balls!: Rebrickz.Balls
	private blocks!: Rebrickz.Blocks
	private state: GameState
	private firstBallToLand!: Rebrickz.Ball | undefined

	gameOver: boolean

	constructor() {
		super({ key: "MainScene" })

		this.state = GameState.WAITING_PLAYER
		this.gameOver = false
	}

	create() {
		/**
		 * World
		 */
		this.world = new Rebrickz.World(this)
		this.world.setCollisionHandler(this.handleWorldCollision)

		const startPosition = { x: this.world.getBounds().centerX, y: this.world.getBoundsBottom() - config.ball.radius }

		/**
		 * Trajectory
		 */
		this.trajectory = new Rebrickz.Trajectory(this, this.world, startPosition.x, startPosition.y)

		this.trajectory.on("fire", this.fireBalls, this)

		// init groups
		this.balls = new Rebrickz.Balls(this)
		this.blocks = new Rebrickz.Blocks(this)

		// TODO: remove

		this.blocks.add(Rebrickz.BrickType.BRICK)
		this.blocks.add(Rebrickz.BrickType.BRICK)
		this.blocks.add(Rebrickz.BrickType.SPECIAL_BALL)
		this.blocks.add(Rebrickz.BrickType.EXTRA_BALL)
		this.blocks.add(Rebrickz.BrickType.BRICK)
		this.blocks.add(Rebrickz.BrickType.BRICK)
		this.blocks.add(Rebrickz.BrickType.SPECIAL_BALL)
		this.blocks.add(Rebrickz.BrickType.EXTRA_BALL)

		// Add first ball
		this.balls.add(Rebrickz.BallType.NORMAL, startPosition.x, startPosition.y)

		this.handleBallCollision()
	}

	update() {
		// if Arcade physics is updating or balls are running and all balls have landed...
		if (this.state === GameState.RUNNING) {
			this.trajectory.setActive(false)
		}

		if (this.state === GameState.WAITING_PLAYER) {
			this.trajectory.setActive(true)

			const lines = [
				...this.blocks.groups[Rebrickz.BrickType.BRICK].getCollidableLines(),
				...this.world.getCollidableLines(),
			]

			this.trajectory.setCollidableLines(lines)
		}

		if (this.state === GameState.UPDATING) {
			// // move the blocks
			// this.moveBlockRow()
			// this.addBlocks()
			// this.collectBalls()
		}

		if (this.gameOver) {
			// this.restartGame()
		}
	}

	fireBalls(direction: number) {
		this.firstBallToLand = undefined
		this.state = GameState.RUNNING
		this.balls.fire(direction)
	}

	handleWorldCollision(_ball: Phaser.Physics.Arcade.Body, up: boolean, down: boolean) {
		if (!down) return

		const ball = _ball.gameObject as Rebrickz.Ball
		ball.stop()

		if (!this.firstBallToLand) {
			this.firstBallToLand = ball
		}

		setTimeout(() => {
			if (this.firstBallToLand) {
				const { x, y } = this.firstBallToLand
				this.trajectory.setPosition(x)
				ball.move(x, y)
			}
		}, 100)

		if (!this.balls.isRunning()) {
			// Wait ball animations before allow next move
			this.time.addEvent({
				delay: 300,
				callback: () => {
					// this.state = GameState.UPDATING
					this.state = GameState.WAITING_PLAYER
				},
			})
		}
	}

	handleBallCollision() {
		const overlap = [
			this.blocks.groups[Rebrickz.BrickType.EXTRA_BALL],
			this.blocks.groups[Rebrickz.BrickType.SPECIAL_BALL],
		]
		const collide = this.blocks.groups[Rebrickz.BrickType.BRICK]

		// collectables bricks
		this.physics.add.overlap(this.balls.group, overlap, (ball, _block) => {
			console.log(ball, _block)
			_block.destroy()
		})

		// collidables bricks
		this.physics.add.collider(this.balls.group, collide, (ball, _block) => {
			const block = _block as Rebrickz.Brick
			block.health.damage()
			// const maxHealth = block.maxHealth
			_block.destroy()
		})
	}
}
