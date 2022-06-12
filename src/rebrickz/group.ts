import { GameConfig as config } from "@config"
import { ExtraBall, Normal, SpecialBall } from "./block"

export type BlockTypeClass = Normal | SpecialBall | ExtraBall

interface GroupInterface {
	get blocks(): BlockTypeClass[]
	add(child: BlockTypeClass, addToScene?: boolean | undefined): this
	getBlocksBounds(): Phaser.Geom.Rectangle[]
	getCollidableLines(): Phaser.Geom.Line[]
}

export class Group extends Phaser.Physics.Arcade.Group implements GroupInterface {
	constructor(
		scene: Phaser.Scene,
		children?:
			| Phaser.GameObjects.GameObject[]
			| Phaser.Types.Physics.Arcade.PhysicsGroupConfig
			| Phaser.Types.GameObjects.Group.GroupCreateConfig,
		config?: Phaser.Types.Physics.Arcade.PhysicsGroupConfig | Phaser.Types.GameObjects.Group.GroupCreateConfig
	) {
		super(scene.physics.world, scene, children, config)
	}

	get blocks(): BlockTypeClass[] {
		return this.getChildren() as BlockTypeClass[]
	}

	add(child: BlockTypeClass, addToScene?: boolean | undefined): this {
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

	getCollidableLines(): Phaser.Geom.Line[] {
		const lines: Phaser.Geom.Line[] = []

		this.blocks.forEach((block) => {
			const bounds = block.getBounds()
			lines.push(bounds.getLineB())
			lines.push(bounds.getLineC())
			lines.push(bounds.getLineD())
		})

		return lines
	}
}
