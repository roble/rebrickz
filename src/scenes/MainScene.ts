import * as Rebrickz from "@rebrickz"

import { GameConfig as config } from "@config"
import { Ball, BallType } from "@objects/Ball"
import { Balls } from "@objects/Balls"
import { Block, BlockType } from "@objects/Block"
import { BlocksManager } from "@objects/BlocksManager"

export enum GameState {
	WAITING_PLAYER,
	AIMING,
	RUNNING,
	UPDATING,
}

export class MainScene extends Phaser.Scene {
	public world!: Rebrickz.World
	public trajectory!: Rebrickz.Trajectory

	private balls!: Balls
	private blocks!: BlocksManager
	private state: GameState
	private direction!: number
	private trajectoryGraphics!: {
		x1: Phaser.GameObjects.Graphics
		x2: Phaser.GameObjects.Graphics
		y1: Phaser.GameObjects.Graphics
		y2: Phaser.GameObjects.Graphics
		center: Phaser.GameObjects.Graphics
	}

	private collision!: Phaser.GameObjects.Image
	private firstBallToLand!: Ball | undefined
	trajectoryRectangle!: Phaser.GameObjects.Rectangle
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

		const firstBallX = this.world.getBounds().centerX
		const firstBallY = this.world.getBoundsBottom() - config.ball.size / 2

		/**
		 * Trajectory
		 */
		this.trajectory = new Rebrickz.Trajectory(this, this.world, firstBallX, firstBallY)

		this.trajectory.on("fire", this.fireBalls, this)

		// init groups
		this.balls = new Balls(this)
		this.blocks = new BlocksManager(this)

		// Add first ball
		this.addBall(firstBallX, firstBallY)

		// Add block
		this.addBlocks()

		// create the trajectory element
		this.trajectoryGraphics = {
			x1: this.add.graphics(),
			y1: this.add.graphics(),
			x2: this.add.graphics(),
			y2: this.add.graphics(),
			center: this.add.graphics(),
		}

		this.trajectoryRectangle = this.add.rectangle(0, 50, config.ball.size, 1000)
		this.trajectoryRectangle.setOrigin(0.5, 1)
		this.trajectoryRectangle.visible = false

		// create element to show collision
		this.collision = this.add.sprite(-50, -50, "collision")

		this.tweens.add({
			targets: this.collision,
			props: {
				angle: { value: "+=360" },
			},
			duration: 3000,
			repeat: -1,
			ease: "Linear",
		})

		// const b = new Rebrickz.Block.Normal(this, { row: 3, col: 2 })

		this.handleBallCollision()
	}

	update() {
		// if Arcade physics is updating or balls are running and all balls have landed...
		if (this.state === GameState.RUNNING) {
			this.trajectory.setActive(false)
		}

		if (this.state === GameState.WAITING_PLAYER) {
			this.trajectory.setActive(true)
			const blocksBounds = this.blocks.groups[BlockType.NORMAL].getBlocksBounds()

			this.trajectory.setBlockBounds(blocksBounds)
		}

		if (this.state === GameState.UPDATING) {
			// // move the blocks
			this.moveBlockRow()
			this.addBlocks()
			// this.collectBalls()
		}

		if (this.gameOver) {
			// this.restartGame()
		}
	}

	fireBalls(direction: number) {
		console.log("fireBalls", direction)

		this.firstBallToLand = undefined
		this.state = GameState.RUNNING

		this.balls.fire(direction)
	}

	/**
	 * Add block
	 */
	addBlock(row: number, col: number, type: BlockType) {
		const block = new Block(this, { row, col, type, level: 1 })

		block.on("destroy", this.handleOnBlockDestroy, this)

		this.blocks.groups[type].add(block, true)

		return block
	}

	addBlocks() {
		const maxDropPerRound = 4
		const { cols } = config

		const rows = 2

		const blocks = Phaser.Math.Between(1, maxDropPerRound)
		const dropSpecialBall = Phaser.Math.Between(0, 100) < 30
		const dropExtraBall = Phaser.Math.Between(0, 100) < 30

		const add = (type: BlockType) => {
			const row = Phaser.Math.Between(1, rows - 1)
			const col = Phaser.Math.Between(0, cols - 1)

			if (this.blocks.isSlotEmpty(row, col)) {
				this.addBlock(row, col, type)
			}
		}

		// if (dropSpecialBall)
		//   add(BlockType.SPECIAL_BALL)

		// if (dropExtraBall)
		//   add(BlockType.EXTRA_BALL)

		for (let i = 0; i < blocks; i++) {
			add(BlockType.NORMAL)
		}

	}

	moveBlockRow() {
		this.state = GameState.UPDATING
		// we will move blocks with a tween
		const blocks = this.blocks.getChildren() as Block[]
		// const balls = this.extraBallGroup.getChildren() as Block[]
		// const extraBalls = this.extraBallGroup.getChildren() as Block[]
		const children = [...blocks] as Block[]

		for (const block of children) {
			const oldRow = block.row
			const { row } = block.moveDown()

			if (row === oldRow && row >= block.lastRowIndex && block.blockType === BlockType.NORMAL) {
				this.gameOver = true
				break
			}
		}

		if (!this.gameOver) {
			// this.level++
			// this.levelText.text = `LEVEL: ${this.level}`
		}
		// wait the animation
		// const tweenConfig = config.block.tweens.move
		this.state = GameState.WAITING_PLAYER
		// this.time.addEvent({
		// 	delay: tweenConfig.delay.max + tweenConfig.duration,
		// 	callback: () => {

		// 	},
		// 	callbackScope: this
		// })
	}

	addBall(x: number, y: number, type: BallType = BallType.NORMAL): Ball | boolean {
		if (!this.balls.getTotalFree()) return false

		const size = config.ball.size
		const ball = new Ball(this)

		ball.x = x
		ball.y = y

		this.balls.add(ball, true)

		// ball.setCircle(ball.width / 2)
		ball.enableCollision(true)
		ball.setOrigin(0.5)

		return ball
	}

	handleWorldCollision(
		_ball: Phaser.Physics.Arcade.Body,
		up: boolean,
		down: boolean,
		_left?: boolean,
		_right?: boolean
	) {
		if (!down) return

		const ball = _ball.gameObject as Ball
		ball.stop()

		if (!this.firstBallToLand) {
			this.firstBallToLand = ball
		}

		setTimeout(() => {
			if (this.firstBallToLand) {
				const x = this.firstBallToLand.x
				this.trajectory.setPosition(x)
				ball.move(x)
			}
		}, 100)

		if (!this.balls.isRunning()) {
			// Wait ball animations before allow next move
			this.time.addEvent({
				delay: 300,
				callback: () => {
					this.state = GameState.UPDATING
				},
			})
		}
	}

	handleBallCollision() {
		this.physics.add.collider(this.balls, this.blocks.groups[BlockType.NORMAL], (ball, _block) => {
			const block = _block as Block
			const health = block.damage(1)
			const maxHealth = block.maxHealth

			// this.increaseCombo()

			// if (health <= 0) {
			//   this.increaseScore(maxHealth)
			// }
		})
	}

	/**
	 * On block destroy
	 */

	handleOnBlockDestroy(block: Block) {
		// const type = block.blockType
		// switch (type) {
		//   case BlockType.SPECIAL_BALL:
		//   case BlockType.EXTRA_BALL: {
		//     const ball = new Ball(this, block.x, block.y, 'ball')
		//     this.ballsCollectedGroup.add(ball, true)
		//     const y = 12 + this.config.world.getBounds().padding_top + this.config.world.getBounds().height + this.config.world.getBounds().padding_x
		//     const x = this.firstBallToLand.x
		//     ball.move(undefined, y)
		//     this.time.addEvent({
		//       delay: 400,
		//       callbackScope: this,
		//       args: [{
		//         alpha: 1,
		//         scale: 1,
		//         ease: 'Quart.easeOut',
		//         duration: 200,
		//         x: x,
		//       }]
		//     })
		//     break;
		//   }
		//   default: {
		//     this.blocksDestroyed++
		//     // this.blocksDestroyedText.text = `BLOCKS DESTROYED: ${this.blocksDestroyed.toString()}`
		//   }
		// }
	}
}
