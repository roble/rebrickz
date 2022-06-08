import { GameConfigType } from "@config"
import { MainScene } from "@scenes/MainScene"

export class World {
	scene: MainScene
	config: GameConfigType
	bounds: any
	collisionHandler: Function

	constructor(scene: MainScene, collisionHandler: Function) {
		this.scene = scene
		this.config = scene.config
		this.collisionHandler = collisionHandler
		this.create()
	}

	getBounds(): Phaser.Geom.Rectangle {
		return this.bounds
	}

	getBoundsBottom(): number {
		return this.bounds.bottom + this.config.block.size
	}

	create() {
		const mainCamera = this.scene.cameras.main

		const ground = this.scene.add.sprite(
			mainCamera.worldView.x + mainCamera.width / 2,
			mainCamera.worldView.y + mainCamera.height / 2,
			"ground"
		)

		ground.setOrigin(0.5)
		ground.setDisplaySize(this.config.world.width, this.config.world.height)

		const worldBounds = ground.getBounds()
		const { x, y, width, height } = worldBounds

		// set the world bounds
		this.scene.physics.world.setBounds(x, y, width, height + height / this.config.rows, true, true, true, true)

		// save the world bounds in a variable
		this.bounds = worldBounds

		// enable collision
		this.scene.physics.world.setBoundsCollision(true, true, true, true)

		// lister for collision with world bounds
		this.scene.physics.world.on("worldbounds", this.collisionHandler, this.scene)

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
