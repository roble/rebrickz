import { GameConfig as config } from "@config"

import { Position } from "./position"
import { World } from "./world"

interface BlockOptions {
	texture?: string
	row: number
	col: number
	level?: number
	frame?: string | number | undefined
}

export enum BrickType {
	BRICK,
	SPECIAL_BALL,
	EXTRA_BALL,
}

class Moveable extends Phaser.Physics.Arcade.Sprite {
	followPosition: unknown[] = []
	row!: number
	col!: number

	animate(args: object): this {
		this.scene?.tweens.add({
			targets: [this, ...this.followPosition],
			...args,
		})
		return this
	}

	/**
	 * @param rows rows to move down or use -1 to move to very last row
	 */
	moveDown(rows = 1): this {
		return this.move(rows > 0 ? this.row + rows : -1, undefined)
	}

	/**
	 * @param rows rows to move up or use -1 to move to very first row
	 */
	moveUp(rows = 1): this {
		return this.move(rows > 0 ? this.row - rows : 0, undefined)
	}

	/**
	 * @param cols cols to move down or use -1 to move to very last col
	 */
	moveLeft(cols = 1): this {
		return this.move(undefined, cols > 0 && this.col > 0 ? this.col - cols : 0)
	}

	/**
	 * @param cols cols to move down or use -1 to move to very last col
	 */
	moveRight(cols = 1): this {
		return this.move(undefined, cols > 0 ? this.col + cols : -1)
	}

	move(row?: number, col?: number): this {
		let targetRow, targetCol

		if (row !== undefined && !World.canMove(row))
			targetRow = row < 0 ? World.lastRowIndex : Math.min(row, World.lastRowIndex)

		if (col !== undefined && !World.canMove(undefined, col))
			targetCol = col < 0 ? World.lastColIndex : Math.min(col, World.lastColIndex)

		if (targetRow !== undefined) this.row = targetRow

		if (targetCol !== undefined) this.col = targetCol

		const { tweens } = config.block

		this.scene.time.addEvent({
			delay: Phaser.Math.Between(tweens.move.delay.min, tweens.move.delay.max),
			callback: this.animate,
			callbackScope: this,
			args: [
				{
					alpha: 1,
					scale: 1,
					ease: tweens.fall.ease,
					duration: tweens.fall.duration,
					x: Position.getXByCol(targetCol ?? this.col),
					y: Position.getYByRow(targetRow ?? this.row),
				},
			],
		})

		return this
	}

	canMove(row?: number | undefined, col?: number | undefined): boolean {
		if (!row && !col) return false
		let flag = false
		if (row !== undefined && (row < 0 || row + 1 >= World.lastRowIndex)) flag = true
		if (col !== undefined && (col < 0 || col + 1 >= World.lastColIndex)) flag = true

		return flag
	}

	fall(): this {
		const { initialPositionY, tweens } = config.block

		const finalY = this.y
		this.y = initialPositionY

		this.scene.time.addEvent({
			delay: Phaser.Math.Between(tweens.fall.delay.min, tweens.fall.delay.max),
			callback: this.animate,
			callbackScope: this,
			args: [
				{
					alpha: 1,
					scale: 1,
					ease: tweens.fall.ease,
					duration: tweens.fall.duration,
					y: finalY,
				},
			],
		})
		return this
	}
}
class Health {
	_level!: number
	health: number
	maxHealth: number

	constructor() {
		this.health = 0
		this.maxHealth = 0
	}

	get level(): number {
		return this._level
	}

	set level(value: number) {
		this._level = value
	}

	render(): this {
		// this.textObject.text = this.health?.toString() ?? "1"

		return this
	}

	damage(): this {
		return this
	}

	heal(): this {
		return this
	}

	kill(): this {
		return this
	}
}
abstract class Block extends Moveable {
	abstract blockType: BrickType
	emitter!: Phaser.GameObjects.Particles.ParticleEmitter
	particle!: Phaser.GameObjects.Particles.ParticleEmitterManager

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		const { row, col, texture = "block" } = options
		super(scene, 0, 0, texture)
		this.fixPosition(row, col)
		this.on("addedtoscene", this.onCreate, this)
	}

	private fixPosition(row: number, col: number) {
		this.setOrigin(0.5, 0)
		this.row = World.isValidRow(row) ? row : 0
		this.col = World.isValidCol(col) ? col : 0

		this.x = Position.getXByCol(this.col)
		this.y = Position.getYByRow(this.row)
	}

	createEmitter(): this {
		this.particle = this.scene.add.particles("ground_tile")
		this.emitter = this.particle.createEmitter({
			x: this.x,
			y: this.y,
			gravityY: 100,
			scale: {
				start: 0.2,
				end: 0,
			},
			speed: {
				min: 50,
				max: 100,
			},
			alpha: {
				min: 0.25,
				max: 0.75,
			},
			active: false,
			lifespan: 1000,
			quantity: 150,
			blendMode: Phaser.BlendModes.COLOR_DODGE,
		})
		this.emitter.startFollow(this)
		return this
	}

	private onCreate(): this {
		const { initialAlpha, initialDepth, initialScale } = config.block
		this.setScale(initialScale).setAlpha(initialAlpha).setDepth(initialDepth).createEmitter().fall()
		return this
	}

	destroy(): void {
		this.emitter.active = true
		this.emitter.explode(20, 0, 0)
		// destroy and remove from scene
		super.destroy(true)
	}
}

export class Brick extends Block {
	readonly blockType: BrickType

	health: Health
	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "block" })
		this.blockType = BrickType.BRICK
		this.health = new Health()
	}
}

export class SpecialBall extends Block {
	readonly blockType: BrickType

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "special_ball" })
		this.blockType = BrickType.SPECIAL_BALL
	}
}

export class ExtraBall extends Block {
	readonly blockType: BrickType

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "extra_ball" })
		this.blockType = BrickType.EXTRA_BALL
	}
}

export default {
	Brick,
	SpecialBall,
	ExtraBall,
	BrickType,
}
