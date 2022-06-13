import { Ball } from "./ball"

export type BallTypeClass = Ball // add other types

export class BallsGroup extends Phaser.Physics.Arcade.Group {
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

	get balls(): BallTypeClass[] {
		return this.getChildren() as BallTypeClass[]
	}

	add(child: BallTypeClass, addToScene?: boolean | undefined): this {
		if (this.getTotalFree() === 0) {
			console.warn(`No more empty slots`)
			return this
		}

		super.add(child, addToScene)

		return this
	}
}
