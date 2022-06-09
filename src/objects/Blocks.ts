import { GameConfig as config } from "@config"
import { Block, BlockType } from "@objects/Block"
import { MainScene } from "@scenes/MainScene"

export class Blocks extends Phaser.Physics.Arcade.Group {

	constructor(scene: MainScene) {
		super(scene.physics.world, scene, {
			immovable: true,
			classType: Block,
			maxSize: config.block.max,
		})
	}

	get blocks(): Block[] {
		return this.getChildren() as Block[]
	}

	add(child: Block, addToScene?: boolean | undefined): this {
		if (this.getTotalFree() === 0) {
			console.warn(`No more empty slots`)
			return this
		}

		super.add(child, addToScene)

		return this
	}

	getBlocksBounds(): Phaser.Geom.Rectangle[] {
		const bounds: Phaser.Geom.Rectangle[] = []

		this.blocks.forEach((block) => {
			bounds.push(block.getBounds())
		})

		return bounds
	}
}
