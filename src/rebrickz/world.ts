import { GameConfig as config } from "@config"
export interface Sides {
	top: Phaser.Geom.Line
	right: Phaser.Geom.Line
	bottom: Phaser.Geom.Line
	left: Phaser.Geom.Line
}
export class World {
	static readonly EVENTS = {
		BALL_COLLIDED: "ball_collided",
	}

	scene: Phaser.Scene
	bounds!: Phaser.Geom.Rectangle
	events = new Phaser.Events.EventEmitter()

	constructor(scene: Phaser.Scene) {
		this.scene = scene
		this.create()
		this.setCollisionHandler()
	}

	create() {
		const background = this.scene.add.sprite(0, 0, "background")
		background.setOrigin(0)

		const ground = this.scene.add.rectangle(
			config.world.left,
			config.world.top,
			config.world.width,
			config.world.height,
			0xffffff
		)

		ground.setOrigin(0)
		ground.setBlendMode(Phaser.BlendModes.MULTIPLY)
		ground.setDisplaySize(config.world.width, config.world.height - config.brick.size)

		const worldBounds = ground.getBounds()

		const { x, y, width, height } = worldBounds

		// set the world bounds
		this.scene.physics.world.setBounds(x, y, width, height + height / config.rows, true, true, true, true)

		// save the world bounds in a variable
		this.bounds = worldBounds

		// enable collision
		this.scene.physics.world.setBoundsCollision(true, true, true, true)

		/**
		 * Debug
		 * TODO: REMOVE
		 **/

		if (!this.scene.game.config.physics.arcade?.debug) return

		this.createWorldTiles()

		const graphics = this.scene.add.graphics()
		const _worldBounds = this.scene.physics.world.bounds
		const thickness = 1
		const color = Phaser.Display.Color.HexStringToColor("000").color
		const alpha = 0.8

		graphics.lineStyle(thickness, color, alpha)

		graphics.strokeRect(_worldBounds.x, _worldBounds.y, _worldBounds.width, _worldBounds.height)
	}

	setCollisionHandler() {
		// lister for collision with world bounds
		this.scene.physics.world.on("worldbounds", this.handleCollision, this)
	}

	static get origin(): Phaser.Geom.Point {
		const x = (config.width - config.world.width) / 2
		const y = (config.height - config.world.height) / 2

		return new Phaser.Geom.Point(x, y)
	}

	static get lastRowIndex(): number {
		return config.rows - 1
	}

	static get lastColIndex(): number {
		return config.cols - 1
	}

	static isValidRow(row: number): boolean {
		return row >= 0 && row <= World.lastRowIndex
	}

	static isValidCol(col: number): boolean {
		return col >= 0 && col <= World.lastColIndex
	}

	static canMove(row?: number | undefined, col?: number | undefined): boolean {
		if (!row && !col) return false

		let flag = false

		if (row !== undefined && World.isValidRow(row)) flag = true
		else flag = false

		if (col !== undefined && World.isValidCol(col)) flag = true
		else flag = false

		return flag
	}

	getStartPosition(): Phaser.Geom.Point {
		return new Phaser.Geom.Point(this.getBounds().centerX, this.getBoundsBottom() - config.ball.radius)
	}

	getBounds(): Phaser.Geom.Rectangle {
		return this.bounds
	}

	getBoundsBottom(): number {
		return this.bounds.bottom + config.brick.size
	}

	getCollidableLines(): Phaser.Geom.Line[] {
		const lines: Phaser.Geom.Line[] = []

		lines.push(this.bounds.getLineA()) //top
		lines.push(this.bounds.getLineB()) //right
		lines.push(this.bounds.getLineD()) //left

		return lines
	}

	getSides(): Sides {
		return {
			top: this.bounds.getLineA(),
			right: this.bounds.getLineB(),
			bottom: this.bounds.getLineC(),
			left: this.bounds.getLineD(),
		}
	}

	createWorldTiles() {
		let isOdd = false

		for (let col = 0; col < config.cols; col++) {
			isOdd = !isOdd
			const blockSize = config.brick.size

			for (let row = 0; row < config.rows; row++) {
				const [x, y] = [this.bounds.left + col * blockSize, this.bounds.top + row * blockSize]
				const sprite = this.scene.add
					.sprite(x, y, "ground_tile")
					.setOrigin(0, 0)
					.setTint(0xf00000)
					.setAlpha(isOdd ? 0.3 : 0.5)

				sprite.displayWidth = blockSize
				sprite.displayHeight = blockSize
				isOdd = !isOdd
			}
		}
	}

	handleCollision(ball: Phaser.Physics.Arcade.Body, up: boolean, down: boolean) {
		if (!down) return
		this.events.emit(World.EVENTS.BALL_COLLIDED, ball)
	}
}
