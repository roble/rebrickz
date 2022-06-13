import { Ball, Balls, BallType, Blocks, Trajectory, World } from "."

export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
}

export class Game extends Phaser.Events.EventEmitter {
	private world: World
	private trajectory: Trajectory
	private balls: Balls
	private blocks: Blocks
	private state: GameState
	private scene: Phaser.Scene
	private gameOver: boolean

	constructor(scene: Phaser.Scene) {
		super()
		this.scene = scene
		this.state = GameState.WAITING_PLAYER
		this.gameOver = false
		this.world = new World(scene)
		this.trajectory = new Trajectory(scene, this.world)
		this.balls = new Balls(scene)
		this.blocks = new Blocks(scene)
		this.create()
	}

	create() {
		this.addEventListeners().addFirstBall()
		this.trajectory.setCollidableLines(this.world.getCollidableLines())
		this.trajectory.setActive(true)
	}

	update() {
		return this
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

	private addEventListeners(): this {
		this.trajectory.on("fire", this.fireBalls, this)
		return this
	}
}
