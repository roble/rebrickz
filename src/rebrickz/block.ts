import { GameConfig as config } from '@config';
import { applyMixins } from '@helpers';
import Rebrickz from '@rebrickz';

export namespace Block {

	type Options = {
		texture?: string
		row: number
		col: number
		level?: number
		frame?: string | number | undefined
	}

	export enum Type {
		NORMAL,
		SPECIAL_BALL,
		EXTRA_BALL,
	}

	interface Interface {
		blockType: Type
		col: number
		row: number
		boot(): this
		destroy(fromScene?: boolean | undefined): void
		create(): this
		getBody(): Phaser.Physics.Arcade.Body
	}

	interface MoveableInterface {
		row: number
		col: number
		followPosition: any[]
		move(row?: number, col?: number): this
		moveDown(rows: number): this
		moveLeft(cols: number): this
		moveRight(cols: number): this
		canMove(row?: number, col?: number): boolean
		fall(): this
	}
	interface EmittableInterface {
		emitter: Phaser.GameObjects.Particles.ParticleEmitter
		startParticleEmitter(): this
		stopParticleEmitter(): this
	}
	interface DamageableInterface {
		_level: number
		readonly health: number
		readonly maxHealth: number
		textObject: Phaser.GameObjects.Text

		get level(): number
		set level(value: number)

		render(): this
		damage(): this
		heal(): this
		kill(): this
	}
	class Moveable extends Phaser.Physics.Arcade.Sprite implements MoveableInterface {
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
			let targetRow,
				targetCol

			if (row !== undefined && !Rebrickz.World.canMove(row))
				targetRow = row < 0 ? Rebrickz.World.lastRowIndex : Math.min(row, Rebrickz.World.lastRowIndex)

			if (col !== undefined && !Rebrickz.World.canMove(undefined, col))
				targetCol = col < 0 ? Rebrickz.World.lastColIndex : Math.min(col, Rebrickz.World.lastColIndex)

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
						x: Rebrickz.Position.getXByCol(targetCol ?? this.col),
						y: Rebrickz.Position.getYByRow(targetRow ?? this.row),
					},
				],
			})

			return this
		}

		canMove(row?: number | undefined, col?: number | undefined): boolean {
			if (!row && !col) return false
			let flag = false
			if (row !== undefined && (row < 0 || row + 1 >= Rebrickz.World.lastRowIndex)) flag = true
			if (col !== undefined && (col < 0 || col + 1 >= Rebrickz.World.lastColIndex)) flag = true

			return flag
		}

		fall(): this {
			console.log("fall")
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
	class Damageable extends Phaser.Physics.Arcade.Sprite implements DamageableInterface {
		_level!: number
		health: number = 0
		maxHealth: number = 0
		textObject!: Phaser.GameObjects.Text

		get level(): number {
			return this._level
		}

		set level(value: number) {
			this._level = value
		}

		render(): this {
			console.log("render damageable")
			// this.textObject.setDepth(this.depth + 2)
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
	export class BaseBlock extends Phaser.Physics.Arcade.Sprite implements Interface {
		col!: number
		row!: number
		level!: number
		blockType!: Type

		constructor(scene: Phaser.Scene, options: Options) {
			const { row, col, texture = 'block' } = options

			super(scene, 0, 0, texture)
			this.fixPosition(row, col)
			this.followPosition = []
		}

		private fixPosition(row: number, col: number) {
			this.setOrigin(0.5, 0)
			this.row = Rebrickz.World.isValidRow(row) ? row : 0
			this.col = Rebrickz.World.isValidCol(col) ? col : 0

			this.x = Rebrickz.Position.getXByCol(this.col)
			this.y = Rebrickz.Position.getYByRow(this.row)
		}

		boot(scene?: Phaser.Scene, options?: Options): this {
			console.log("boot base", scene, options)
			this.on("addedtoscene", this.create, this)
			return this
		}

		getBody(): Phaser.Physics.Arcade.Body {
			return this.body as Phaser.Physics.Arcade.Body
		}

		create() {
			console.log("added to scene")
			const { initialAlpha, initialDepth, initialScale } = config.block
			this.setScale(initialScale)
			this.setAlpha(initialAlpha)
			this.setDepth(initialDepth)
			this.fall()
			return this
		}

		destroy(fromScene?: boolean | undefined): void {
			console.log("destroy")
			super.destroy(fromScene)
		}
	}

	export class Normal extends BaseBlock {
		constructor(scene: Phaser.Scene, options: Options) {
			super(scene, { ...options, texture: "block" })
			this.blockType = Type.NORMAL
			this.boot()
		}

		boot(): this {
			console.log("boot normal")
			super.boot()
			this.textObject = this.scene.add.text(
				this.x,
				config.block.initialPositionY,
				this.health?.toString(),
				config.block.text.style
			)
			this.textObject.setAlpha(0)
			this.textObject.setDepth(this.depth + 1)
			this.textObject.setOrigin(0.5, -1.5)
			this.followPosition.push(this.textObject)

			this.render()

			return this
		}
	}

	export class SpecialBall extends BaseBlock {
		constructor(scene: Phaser.Scene, options: Options) {
			super(scene, { ...options, texture: "special_ball" })
			this.blockType = Type.SPECIAL_BALL
		}
	}

	export class ExtraBall extends BaseBlock {
		constructor(scene: Phaser.Scene, options: Options) {
			super(scene, { ...options, texture: "extra_ball" })
			this.blockType = Type.EXTRA_BALL
		}
	}

	// Export as an interface to extends other classes and
	// then merge the classes applying the mixins
	export interface BaseBlock extends Moveable { }
	export interface Normal extends Moveable, Damageable { }

	applyMixins(BaseBlock, [Moveable])
	applyMixins(Normal, [Moveable, Damageable])
}
