import { GameConfig as config } from "@config"
import { applyMixins } from "@helpers"
import { MainScene } from "@scenes/MainScene"

export enum BlockType {
	NORMAL,
	SPECIAL_BALL,
	EXTRA_BALL,
}

type BlockOptions = {
	row: number
	col: number
	type: BlockType
	texture?: string
	level?: number
	frame?: string | number | undefined
}

export type RowColPosition = {
	row: number
	col: number
}

interface BlockInterface {
	col: number
	row: number
}

abstract class BlockBase extends Phaser.Physics.Arcade.Sprite {
	protected _type!: BlockType
	protected _row = 0
	protected _col = 0
	protected _text!: Phaser.GameObjects.Text
	protected _emitter!: Phaser.GameObjects.Particles.ParticleEmitter
	protected _particle!: Phaser.GameObjects.Particles.ParticleEmitterManager
	protected _level: number | undefined
	protected _health!: number
	protected _maxHealth!: number

	constructor(scene: MainScene, options: BlockOptions) {
		const { row, col, texture = "block", frame, level, type } = options

		super(scene, row, col, texture, frame)

		this._row = row
		this._col = col
		this._level = level
		this._type = type
		this.init()
	}

	// Getters and setters

	get health(): number {
		return this._health
	}

	get maxHealth(): number {
		return this._maxHealth
	}

	get blockSize(): number {
		return config.block.size
	}

	get row(): number {
		return this._row
	}

	set row(value: number) {
		this._row = value
	}

	get col(): number {
		return this._col
	}

	set col(value: number) {
		this._col = value
	}

	get text(): Phaser.GameObjects.Text {
		return this._text
	}

	set text(text: Phaser.GameObjects.Text) {
		this._text = text
	}

	get blockType(): BlockType {
		return this._type
	}

	get lastRowIndex(): number {
		return config.rows - 1
	}

	get lastColIndex(): number {
		return config.cols - 1
	}

	// Private Methods

	private init() {
		// resize to configured block size
		this.resizeToBlockSize()
		// double the scale to improve the animation effect
		this.setScale(2)
		// set alpha to zero to have a fade effect on the animation
		this.setAlpha(0)
		// set the depth to zero to be behind other elements
		this.setDepth(0)
		// create a new emitter for animations on destroy and create
		this.createEmitter()
		// add event listeners
		this.addEventListeners()
		// set health
		this.initHealth()
		// add health text
		this.addHealthText()
		// fix the x and y position and animate
		this.animateFall()
	}

	private addHealthText() {
		if (this.blockType !== BlockType.NORMAL) return

		const { x } = this.getPositionFromRowAndCol()
		const text = this.scene.add.text(x, 0, this.health.toString(), {
			font: "bold 12px Arial",
			align: "center",
			color: "#000000",
		})
		text.setScale(2)
		text.setOrigin(0.5)
		text.setAlpha(0)
		text.setDepth(this.depth + 1)

		this.text = text
	}

	private initHealth() {
		const health = Math.ceil((this._level || 0) * 1.333)
		this._maxHealth = health
		this._health = health
	}

	private resizeToBlockSize() {
		this.displayWidth = this.blockSize
		this.displayHeight = this.blockSize
	}

	private animateMove() {
		const { x, y } = this.getPositionFromRowAndCol()

		this.scene.time.addEvent({
			delay: Phaser.Math.Between(0, 300),
			callback: this.animate,
			callbackScope: this,
			args: [
				{
					alpha: 1,
					scale: 1,
					ease: "Quart.easeOut",
					duration: 200,
					x: x,
					y: y,
				},
			],
		})
	}

	private animateFall() {
		const { x, y } = this.getPositionFromRowAndCol()

		this.x = x

		this.scene.time.addEvent({
			delay: Phaser.Math.Between(0, 300),
			callback: this.animate,
			callbackScope: this,
			args: [
				{
					alpha: 1,
					scale: 1,
					ease: "Bounce",
					duration: 500,
					y: y,
				},
			],
		})
	}

	private animate(args: object) {
		this.scene?.tweens.add({
			targets: [this, this.text],
			...args,
		})
	}

	private addEventListeners() {
		this.addListener("destroy", this.onDestroy)
	}

	private removeEventListeners() {
		this.removeListener("destroy", this.onDestroy)
	}

	private checkOutOfBounds(row?: number, col?: number): boolean {
		if (!row && !col) return false

		let flag = false

		if (row !== undefined && (row < 0 || row + 1 >= this.lastRowIndex)) flag = true

		if (col !== undefined && (col < 0 || col + 1 >= this.lastColIndex)) flag = true

		return flag
	}

	private getPositionFromRowAndCol(): Phaser.Geom.Point {
		const { world } = this.scene as MainScene
		const x = world.getBounds().left + this.blockSize / 2 + this.col * this.blockSize
		const y = world.getBounds().top + this.blockSize / 2 + this.row * this.blockSize

		return new Phaser.Geom.Point(x, y)
	}

	private createEmitter() {
		this._particle = this.scene.add.particles("block")
		this._emitter = this._particle.createEmitter({
			x: this.x,
			y: this.y,
			gravityY: 100,
			scale: {
				start: 0.33,
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
		})
		this._emitter.startFollow(this)
	}

	private onDestroy() {
		this.removeEventListeners()
	}

	private updateHealthText() {
		this._text.text = this._health.toString()
	}

	damage(value: number): number {
		this._health = Math.max(0, this._health - value)
		this.updateHealthText()

		if (this._health <= 0) this.destroy(true)

		return this._health
	}

	/**
	 * @param rows total rows to move down or use -1 to move to very last row
	 */
	moveDown(rows = 1): RowColPosition {
		return this.move(rows > 0 ? this.row + rows : -1, undefined)
	}

	move(row?: number, col?: number): RowColPosition {
		let targetRow = row,
			targetCol = col

		if (row !== undefined && this.checkOutOfBounds(row))
			targetRow = row < 0 ? this.lastRowIndex : Math.min(row, this.lastRowIndex)

		if (col !== undefined && this.checkOutOfBounds(col))
			targetCol = col < 0 ? this.lastColIndex : Math.min(col, this.lastColIndex)

		if (targetRow !== undefined) this.row = targetRow

		if (targetCol !== undefined) this.col = targetCol

		this.animateMove()

		return { row: this.row, col: this.col }
	}

	destroy(fromScene?: boolean): void {
		this._emitter.active = true
		this._emitter.explode(20, 0, 0)
		this.text?.destroy(true)

		super.destroy(fromScene)
	}
}

export class Block extends BlockBase {
	constructor(scene: MainScene, options: BlockOptions) {
		const { texture, type } = options

		let _texture
		if (!texture)
			switch (type) {
				case BlockType.EXTRA_BALL:
					_texture = "extra_ball"
					break
				case BlockType.SPECIAL_BALL:
					_texture = "ball_block"
					break
				default:
					_texture = "block"
			}

		super(scene, { ...options, texture: _texture })
	}
}

export class Moveable {}

export class Emittable {}

export interface Block extends Moveable, Emittable {}

applyMixins(Block, [Moveable, Emittable])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// function applyMixins(derivedConstructor: any, constructors: any[]) {
//     constructors.forEach((baseConstructor) => {
//         Object.getOwnPropertyNames(baseConstructor.prototype).forEach((name) => {
//             Object.defineProperty(
//                 derivedConstructor.prototype,
//                 name,
//                 Object.getOwnPropertyDescriptor(baseConstructor.prototype, name) ||
//                 Object.create(null)
//             );
//         });
//     });
// }
