import { Base, BrickType } from "./brick/base"

export class BrickGroup extends Phaser.Physics.Arcade.Group {
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

	get bricks(): Base[] {
		return this.getChildren() as Base[]
	}

	add(child: Base, addToScene?: boolean | undefined): this {
		if (this.getTotalFree() === 0) {
			const type = BrickType[child.brickType]
			console.warn(`No more empty slots - ${type}`)
			return this
		}
		super.add(child, addToScene)

		return this
	}

	getBlocksBounds(): Phaser.Geom.Rectangle[] {
		const bounds: Phaser.Geom.Rectangle[] = []

		this.bricks.forEach((block) => {
			bounds.push(block.getBounds())
		})

		return bounds
	}

	getCollidableLines(): Phaser.Geom.Line[] {
		const lines: Phaser.Geom.Line[] = []

		this.bricks.forEach((block) => {
			const bounds = block.getBounds()
			lines.push(bounds.getLineB())
			lines.push(bounds.getLineC())
			lines.push(bounds.getLineD())
		})

		return lines
	}
}
