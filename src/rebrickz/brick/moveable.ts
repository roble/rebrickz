import { GameConfig as config } from "@config"
import { Position, World } from ".."

export class Moveable extends Phaser.Physics.Arcade.Sprite {
	static readonly EVENTS = {
		MOVE: "move",
		MOVE_START: "move_start",
		MOVE_END: "move_end",
		IN_LAST_ROW: "in_last_row",
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	followPosition: any[] = []
	row!: number
	col!: number

	animate(args: object): this {
		this.scene?.tweens.add({
			targets: [this, ...this.followPosition],
			onUpdate: () => this.emit(Moveable.EVENTS.MOVE),
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
		this.emit(Moveable.EVENTS.MOVE_START)
		let targetRow: number | undefined, targetCol: number | undefined

		if (row !== undefined && !World.canMove(row))
			targetRow = row < 0 ? World.lastRowIndex : Math.min(row, World.lastRowIndex)

		if (col !== undefined && !World.canMove(undefined, col))
			targetCol = col < 0 ? World.lastColIndex : Math.min(col, World.lastColIndex)

		if (targetRow !== undefined) this.row = targetRow
		else targetRow = this.row + 1

		if (targetCol !== undefined) this.col = targetCol

		const { tweens } = config.brick

		return new Promise((resolve) => {
			const args = {
				alpha: 1,
				scale: 1,
				ease: tweens.move.ease,
				duration: tweens.move.duration,
				x: Position.getXByCol(targetCol ?? this.col),
				y: Position.getYByRow(targetRow ?? this.row),
				onComplete: () => {
					resolve(this)
					this.emit(Moveable.EVENTS.MOVE_END)
					if (this.row === World.lastRowIndex) this.emit(Moveable.EVENTS.IN_LAST_ROW)
				},
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
		const { initialPositionY, tweens } = config.brick

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
