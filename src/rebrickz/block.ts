import { GameConfig as config } from "@config"
import { applyMixins } from "@helpers"

import { Position } from "./position"
import { World } from "./world"

type Options = {
	texture?: string
	row: number
	col: number
	level?: number
	frame?: string | number | undefined
}

export enum BlockType {
	NORMAL,
	SPECIAL_BALL,
	EXTRA_BALL,
}

interface BlockInterface {
	blockType: BlockType
	col: number
	row: number
	boot(): this
	destroy(fromScene?: boolean | undefined): void
	create(): this
	getBody(): Phaser.Physics.Arcade.Body
}

class Moveable extends Phaser.Physics.Arcade.Sprite {
	row!: number
	col!: number
	followPosition: any[] = []

	private animate(args: object) {
		this.scene?.tweens.add({
			targets: [this, ...this.followPosition],
			...args,
		})
	}

	/**
	 * @param rows rows to move down or use -1 to move to very last row
	 */
	moveDown(rows = 1): this {
		return this.move(rows > 0 ? this.row + rows : -1, undefined)
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
class Damageable extends Phaser.Physics.Arcade.Sprite {
	_level!: number
	health = 0
	maxHealth = 0
	textObject!: Phaser.GameObjects.Text

	get level(): number {
		return this._level
	}

	set level(value: number) {
		this._level = value
	}

	render(): this {
		this.textObject.text = this.health?.toString() ?? "1"

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
export class BaseBlock extends Phaser.Physics.Arcade.Sprite implements BlockInterface {
	col!: number
	row!: number
	level!: number
	blockType!: BlockType

	constructor(scene: Phaser.Scene, options: Options) {
		const { row, col, texture = "block" } = options

		super(scene, 0, 0, texture)
		this.fixPosition(row, col)
		this.followPosition = []
	}

	private fixPosition(row: number, col: number) {
		this.setOrigin(0.5, 0)
		this.row = World.isValidRow(row) ? row : 0
		this.col = World.isValidCol(col) ? col : 0

		this.x = Position.getXByCol(this.col)
		this.y = Position.getYByRow(this.row)
	}

	boot(): this {
		this.on("addedtoscene", this.create, this)
		return this
	}

	getBody(): Phaser.Physics.Arcade.Body {
		return this.body as Phaser.Physics.Arcade.Body
	}

	create() {
		const { initialAlpha, initialDepth, initialScale } = config.block
		this.setScale(initialScale)
		this.setAlpha(initialAlpha)
		this.setDepth(initialDepth)
		this.fall()
		return this
	}

	destroy(fromScene?: boolean | undefined): void {
		super.destroy(fromScene)
	}
}

export class Normal extends BaseBlock implements Moveable, Damageable {
	constructor(scene: Phaser.Scene, options: Options) {
		super(scene, { ...options, texture: "block" })
		this.blockType = BlockType.NORMAL
		this.boot()
	}

	boot(): this {
		super.boot()
		this.createTextObject()
		this.render()
		return this
	}

	private createTextObject(): void {
		this.textObject = this.scene.add.text(
			this.x,
			config.block.initialPositionY,
			this.health?.toString(),
			config.block.text.style
		)
		this.textObject
			.setShadow(0, 0, "#000", 5)
			.setStroke("#fff", 5)
			.setAlpha(0)
			.setDepth(this.depth + 1)
			.setOrigin(0.5, -0.8)
		this.followPosition.push(this.textObject)
	}
}

export class SpecialBall extends BaseBlock implements Moveable {
	constructor(scene: Phaser.Scene, options: Options) {
		super(scene, { ...options, texture: "special_ball" })
		this.blockType = BlockType.SPECIAL_BALL
	}
}

export class ExtraBall extends BaseBlock implements Moveable {
	constructor(scene: Phaser.Scene, options: Options) {
		super(scene, { ...options, texture: "extra_ball" })
		this.blockType = BlockType.EXTRA_BALL
	}
}

// Export as an interface to extends other classes and
// then merge the classes applying the mixins
export interface BaseBlock extends Moveable, Phaser.Physics.Arcade.Sprite {}
export interface Normal extends Moveable, Damageable {}

applyMixins(BaseBlock, [Moveable])
applyMixins(Normal, [Moveable, Damageable])

export default {
	Normal,
	SpecialBall,
	ExtraBall,
	BlockType,
}
