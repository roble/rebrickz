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
	EXTRA_LIFE,
}

class Moveable extends Phaser.Physics.Arcade.Sprite {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	followPosition: any[] = []
	row!: number
	col!: number

	animate(args: object): this {
		this.scene?.tweens.add({
			targets: [this, ...this.followPosition],
			onUpdate: () => this.emit("move"),
			...args,
		})
		return this
	}

	addToFollow(element: Phaser.GameObjects.Text | Phaser.GameObjects.Graphics) {
		this.followPosition.push(element)
	}

	/**
	 * @param rows rows to move down or use -1 to move to very last row
	 */
	async moveDown(rows = 1): Promise<this> {
		return this.move(rows > 0 ? this.row + rows : -1, undefined)
	}

	/**
	 * @param rows rows to move up or use -1 to move to very first row
	 */
	async moveUp(rows = 1): Promise<this> {
		return this.move(rows > 0 ? this.row - rows : 0, undefined)
	}

	/**
	 * @param cols cols to move down or use -1 to move to very last col
	 */
	async moveLeft(cols = 1): Promise<this> {
		return this.move(undefined, cols > 0 && this.col > 0 ? this.col - cols : 0)
	}

	/**
	 * @param cols cols to move down or use -1 to move to very last col
	 */
	async moveRight(cols = 1): Promise<this> {
		return this.move(undefined, cols > 0 ? this.col + cols : -1)
	}

	async move(row?: number, col?: number): Promise<this> {
		let targetRow: number | undefined, targetCol: number | undefined

		if (row !== undefined && !World.canMove(row))
			targetRow = row < 0 ? World.lastRowIndex : Math.min(row, World.lastRowIndex)

		if (col !== undefined && !World.canMove(undefined, col))
			targetCol = col < 0 ? World.lastColIndex : Math.min(col, World.lastColIndex)

		if (targetRow !== undefined) this.row = targetRow
		else targetRow = this.row + 1

		if (targetCol !== undefined) this.col = targetCol

		const { tweens } = config.block

		return new Promise((resolve) => {
			const args = {
				alpha: 1,
				scale: 1,
				ease: tweens.fall.ease,
				duration: tweens.fall.duration,
				x: Position.getXByCol(targetCol ?? this.col),
				y: Position.getYByRow(targetRow ?? this.row),
				onComplete: () => resolve(this),
				onCompleteContext: this,
			}
			this.animate(args)
		})
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
class Health extends Phaser.Events.EventEmitter {
	static readonly EVENTS = {
		DIED: "died",
	}

	_level!: number
	health: number
	maxHealth: number
	bar: Phaser.GameObjects.Graphics
	healthText: Phaser.GameObjects.Text
	criticalText: Phaser.GameObjects.Text
	instantKillText: Phaser.GameObjects.Text
	scene: Phaser.Scene
	parent: Brick
	_x: number
	_y: number
	offsetY = -config.block.size + 7
	width = 30
	height = 6

	constructor(scene: Phaser.Scene, parent: Brick, health: number) {
		super()
		this.scene = scene
		this.health = Math.ceil(health)
		this.maxHealth = this.health
		this.parent = parent
		this._x = this.parent.x - this.width / 2
		this._y = this.parent.y - this.offsetY

		/**
		 * Bar
		 */
		this.bar = scene.add.graphics()
		this.bar.alpha = 1
		this.bar.x = this._x
		this.bar.y = this._y
		/**
		 * Health Text
		 */
		this.healthText = scene.add.text(this._x + this.width / 2, this._y, this.health.toString(), {
			fixedWidth: this.width,
			fontSize: "10px",
			color: "#3F3F3F",
			fontFamily: "Arial Black",
			stroke: "#fff",
			strokeThickness: 4,
		})
		this.healthText.setAlpha(0).setDepth(1).setOrigin(0.5).setAlign("center")
		/**
		 * Critical Text
		 */
		this.criticalText = scene.add.text(this._x + this.width / 2, 0, "Critical", {
			fontSize: "11px",
			color: "#a31f1e",
			fontFamily: "Arial Black",
			stroke: "#FFF",
			strokeThickness: 6,
			align: "center",
		})
		this.criticalText.setScale(0).setVisible(false).setDepth(10).setOrigin(0.5)

		/**
		 * Critical Text
		 */
		this.instantKillText = scene.add.text(this._x + this.width / 2, 0, "Instant Kill", {
			fontSize: "11px",
			color: "#40285e",
			fontFamily: "Arial Black",
			stroke: "#FFF",
			strokeThickness: 6,
			align: "center",
		})
		this.instantKillText.setScale(0).setVisible(false).setDepth(10).setOrigin(0.5)

		/**
		 * Follow parent animations
		 */
		this.parent.addToFollow(this.bar)
		this.parent.addToFollow(this.healthText)
		this.parent.addToFollow(this.criticalText)
	}

	update() {
		this.x = this.parent.x
		this.y = this.parent.y
		this.draw()
	}

	get x() {
		return this._x - this.width / 2
	}

	set x(value: number) {
		this._x = value
	}

	get y() {
		return this._y - this.offsetY
	}

	set y(value: number) {
		this._y = value
	}

	draw() {
		this.criticalText.setAlpha(0)
		this.instantKillText.setAlpha(0)

		if (this.health)
			this.healthText
				.setAlpha(1)
				.setText(this.health.toString())
				.setPosition(this.x + this.width / 2, this.y + 2)
		else this.healthText.setVisible(false)

		this.bar.clear().setPosition(0)

		//  BG
		this.bar
			.fillStyle(0x3f3f3f)
			.fillRect(this.x, this.y, this.width, this.height)
			.setDepth(1)
			.fillStyle(0xffffff)
			.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2)

		if (this.percentage * 100 < 30) {
			this.bar.fillStyle(0xff6464)
		} else {
			this.bar.fillStyle(0x59dc66)
		}

		this.bar.fillRect(this.x + 1, this.y + 1, (this.width - 2) * this.percentage, this.height - 2)

		return this
	}

	get percentage(): number {
		return this.health / this.maxHealth
	}

	get level(): number {
		return this._level
	}

	set level(value: number) {
		this._level = value
	}

	set alpha(value: number) {
		// this.bar.alpha = value
	}

	private animateText(text: Phaser.GameObjects.Text): Promise<this> {
		text
			.setScale(0)
			.setVisible(true)
			.setY(this.y + 20)

		return new Promise((resolve) => {
			this.scene.tweens.timeline({
				targets: text,
				ease: "Power3",
				tweens: [
					{
						y: this._y - 5,
						scale: 1,
						alpha: { from: 0, to: 1 },
						duration: 300,
					},
					{
						alpha: { from: 1, to: 0 },
						duration: 100,
					},
				],
				onComplete: () => {
					resolve(this)
				},
			})
		})
	}

	decrease(value = 1, draw = true) {
		const _value = Math.ceil(value)
		if (this.health >= _value && this.health - _value > 0) {
			this.health -= _value
		} else {
			this.health = 0
			this.emit(Health.EVENTS.DIED)
		}

		if (draw) this.draw()
	}

	damage(type = Block.DAMAGE_TYPE.NORMAL): this {
		switch (type) {
			case Block.DAMAGE_TYPE.NORMAL: {
				this.decrease()
				break
			}
			case Block.DAMAGE_TYPE.CRITICAL: {
				this.decrease(Math.max(this.health * config.ball.criticalHealthPercentage, 1))
				this.animateText(this.criticalText)
				break
			}
			case Block.DAMAGE_TYPE.INSTANT_KILL: {
				this.decrease(this.health)
				this.animateText(this.instantKillText)
				break
			}
			default:
				console.log("DAMAGE", type)
				break
		}

		return this
	}
}
abstract class Block extends Moveable {
	abstract brickType: BrickType
	emitter!: Phaser.GameObjects.Particles.ParticleEmitter

	static readonly DAMAGE_TYPE = {
		NORMAL: "normal",
		CRITICAL: "critical",
		INSTANT_KILL: "instant_kill",
	}

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		const { row, col, texture = "block" } = options
		super(scene, 0, 0, texture)
		this.fixPosition(row, col)
		this.on("addedtoscene", this.onCreate, this)
	}

	private onCreate(): this {
		const { initialAlpha, initialDepth, initialScale } = config.block
		this.setScale(initialScale)
		this.setAlpha(initialAlpha)
		this.setDepth(initialDepth)
		this.createEmitter()
		this.fall()
		return this
	}

	private fixPosition(row: number, col: number) {
		this.setOrigin(0.5, 0)
		this.row = World.isValidRow(row) ? row : 0
		this.col = World.isValidCol(col) ? col : 0

		this.x = Position.getXByCol(this.col)
		this.y = Position.getYByRow(this.row)
	}

	createEmitter(): this {
		this.emitter = this.scene.add.particles("ground_tile").createEmitter({
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

	destroy(): void {
		this.emitter.active = true
		this.emitter.explode(20, 0, 0)

		if (this.followPosition.length) {
			this.followPosition.forEach((e) => {
				if (e && e.destroy) e.destroy()
			})
		}

		// destroy and remove from scene
		super.destroy(true)
	}
}

export class Brick extends Block {
	readonly brickType: BrickType

	health: Health

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "block" })
		this.brickType = BrickType.BRICK
		this.health = new Health(scene, this, options.level || 1)
		this.health.on(Health.EVENTS.DIED, () => {
			this.body.enable = false
			this.setAlpha(0.5)
			setTimeout(() => {
				this.destroy()
			}, 300)
		})
		this.on("move", this.health.update, this.health)
		this.on("destroy", this.health.destroy, this)
	}
}

export class SpecialBall extends Block {
	readonly brickType: BrickType

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "special_ball" })
		this.brickType = BrickType.SPECIAL_BALL
	}
}

export class ExtraBall extends Block {
	readonly brickType: BrickType

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "extra_ball" })
		this.brickType = BrickType.EXTRA_BALL
	}
}

export class ExtraLife extends Block {
	readonly brickType: BrickType

	constructor(scene: Phaser.Scene, options: BlockOptions) {
		super(scene, { ...options, texture: "life" })
		this.brickType = BrickType.EXTRA_LIFE
	}
}

export default {
	Brick,
	SpecialBall,
	ExtraBall,
	ExtraLife,
	BrickType,
}
