/* eslint-disable @typescript-eslint/ban-types */
import { GameConfig as config } from "@config"

export interface Sides {
	top: Phaser.Geom.Line
	right: Phaser.Geom.Line
	bottom: Phaser.Geom.Line
	left: Phaser.Geom.Line
}
export class World {
	scene: Phaser.Scene
	bounds!: Phaser.Geom.Rectangle
	collisionHandler!: Function

	constructor(scene: Phaser.Scene) {
		this.scene = scene
		this.create()
	}

	setCollisionHandler(handler: Function) {
		this.collisionHandler = handler
		// lister for collision with world bounds
		this.scene.physics.world.on("worldbounds", this.collisionHandler, this.scene)
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
		return this.bounds.bottom + config.block.size
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
			const blockSize = config.block.size

			for (let row = 0; row < config.rows; row++) {
				const [x, y] = [this.bounds.left + col * blockSize, this.bounds.top + row * blockSize]
				const sprite = this.scene.add
					.sprite(x, y, "ground_tile")
					.setOrigin(0, 0)
					.setAlpha(isOdd ? 0.03 : 0.05)

				sprite.displayWidth = blockSize
				sprite.displayHeight = blockSize
				isOdd = !isOdd
			}
		}
	}

	create() {
		const ground = this.scene.add.sprite(config.width / 2, config.height / 2, "ground")

		ground.setOrigin(0.5)
		ground.setBlendMode(Phaser.BlendModes.MULTIPLY)
		ground.setDisplaySize(config.world.width, config.world.height - config.block.size)

		const worldBounds = ground.getBounds()
		const { x, y, width, height } = worldBounds

		// set the world bounds
		this.scene.physics.world.setBounds(x, y, width, height + height / config.rows, true, true, true, true)

		// save the world bounds in a variable
		this.bounds = worldBounds

		// enable collision
		this.scene.physics.world.setBoundsCollision(true, true, true, true)

		this.createWorldTiles()

		/**
		 * Debug
		 * TODO: REMOVE
		 **/

		if (!this.scene.game.config.physics.arcade?.debug) return

		const graphics = this.scene.add.graphics()
		const _worldBounds = this.scene.physics.world.bounds
		const thickness = 1
		const color = Phaser.Display.Color.HexStringToColor("bea3f6").color
		const alpha = 0.5

		graphics.lineStyle(thickness, color, alpha)

		graphics.strokeRect(_worldBounds.x, _worldBounds.y, _worldBounds.width, _worldBounds.height)
	}
}
