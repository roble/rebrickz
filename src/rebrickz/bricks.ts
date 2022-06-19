import { GameConfig as config } from "@config"
import { Balls } from "./balls"
import { BrickType, ExtraBall, Brick, SpecialBall, ExtraLife } from "./brick"
import { BlockTypeClass, BrickGroup } from "./brick-group"
import { World } from "./world"

export type BlockGroup = {
	[key in BrickType]: BrickGroup
}

export class Bricks extends Phaser.Events.EventEmitter {
	static readonly EVENTS = {
		COLLIDED_WORLD_DOWN: "collided_world_down",
		COLLECTED: "collected",
	}

	private scene: Phaser.Scene
	groups!: BlockGroup
	balls: Balls

	constructor(scene: Phaser.Scene, balls: Balls) {
		super()
		this.scene = scene
		this.balls = balls
		this.createGroups(scene)
		this.setCollisionHandler()
	}

	restart() {
		this.getChildren().forEach((e) => e.destroy())
	}

	setCollisionHandler(): this {
		const overlap = [
			this.groups[BrickType.EXTRA_BALL],
			this.groups[BrickType.SPECIAL_BALL],
			this.groups[BrickType.EXTRA_LIFE],
		]
		const collide = this.groups[BrickType.BRICK]

		// collectables bricks
		this.scene.physics.overlap(this.balls.group, overlap, (ball, brick) => {
			brick.destroy(true)
			this.emit(Bricks.EVENTS.COLLECTED, brick)
		})

		// collidables bricks
		this.scene.physics.collide(this.balls.group, collide, (ball, _brick) => {
			const brick = _brick as Brick
			brick.health.damage()
		})

		return this
	}

	destroyRow(rowIndex: number) {
		const bricks = this.getChildren().filter((brick) => brick.row === rowIndex)
		bricks.forEach((brick) => {
			brick.destroy()
		})
	}

	private createCallback(obj: Phaser.GameObjects.GameObject) {
		return obj //TODO: remove
	}

	private removeCallback(obj: Phaser.GameObjects.GameObject) {
		return obj //TODO: remove
	}

	getCollidableLines(): Phaser.Geom.Line[] {
		const lines = []

		lines.push(...this.groups[BrickType.BRICK].getCollidableLines())

		return lines
	}

	getChildrenByType(type: BrickType) {
		return this.groups[type].bricks as BlockTypeClass[]
	}

	getChildren() {
		let children: BlockTypeClass[] = []
		for (const type of this.getBlockTypes()) {
			children = [...children, ...this.getChildrenByType(type)]
		}
		return children
	}

	async move(): Promise<this> {
		const bricks = this.getChildren()
		const inLastRow = bricks.filter((brick) => brick.row === World.lastRowIndex)
		const bricksToMove = bricks.filter((brick) => brick.row < World.lastRowIndex)
		if (inLastRow.length) this.emit(Bricks.EVENTS.COLLIDED_WORLD_DOWN)

		return Promise.all(bricksToMove.map((brick) => brick.moveDown())).then(() => {
			return this
		})
	}

	async createRandom(level: number): Promise<this> {
		const total = Phaser.Math.Between(1, config.block.maxPerRow)
		const dropExtraBall = Phaser.Math.Between(0, 100) < config.block.dropProbability.extra
		const dropSpecialBall = Phaser.Math.Between(0, 100) < config.block.dropProbability.special
		const dropLife = Phaser.Math.Between(0, 100) < config.block.dropProbability.life

		const bricks = []

		if (this.balls.group.getTotalFree()) {
			if (dropExtraBall) {
				this.add(BrickType.EXTRA_BALL)
			}

			if (dropSpecialBall) {
				this.add(BrickType.SPECIAL_BALL)
			}
		}

		if (dropLife) {
			this.add(BrickType.EXTRA_LIFE)
		}

		for (let i = 0; i < total; i++) {
			bricks.push(this.add(BrickType.BRICK, level))
		}

		return Promise.all(bricks).then(() => this)
	}

	async add(type: BrickType, level?: number): Promise<this> {
		const { min, max } = config.block.dropOnRows
		const { row, col } = this.getRandomFreeSlot(min, max)

		if (row === -1) {
			console.warn("No more slots available")
			return new Promise((resolve) => resolve(this))
		}

		switch (type) {
			case BrickType.BRICK:
				this.groups[BrickType.BRICK].add(
					new Brick(this.scene, {
						row: row,
						col: col,
						level: level ? Math.pow(level, config.block.levelIncrement) : 1,
					}),
					true
				)
				break
			case BrickType.SPECIAL_BALL:
				this.groups[BrickType.SPECIAL_BALL].add(new SpecialBall(this.scene, { row: row, col: col }), true)
				break
			case BrickType.EXTRA_BALL:
				this.groups[BrickType.EXTRA_BALL].add(new ExtraBall(this.scene, { row: row, col: col }), true)
				break
			case BrickType.EXTRA_LIFE:
				this.groups[BrickType.EXTRA_LIFE].add(new ExtraLife(this.scene, { row: row, col: col }), true)
				break

			default:
				console.warn("Unknown block type ")
				break
		}

		const { delay, duration } = config.block.tweens.fall

		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(this)
			}, delay.max + duration)
		})
	}

	private createGroups(scene: Phaser.Scene): this {
		const callbacks = {
			createCallback: (obj: Phaser.GameObjects.GameObject) => {
				this.createCallback(obj)
			},
			removeCallback: (obj: Phaser.GameObjects.GameObject) => {
				this.removeCallback(obj)
			},
		}
		const groupNormal = new BrickGroup(scene, {
			immovable: true,
			classType: Brick,
			maxSize: config.block.max.normal,
			...callbacks,
		})

		const groupSpecial = new BrickGroup(scene, {
			immovable: true,
			classType: SpecialBall,
			maxSize: config.block.max.special,
			...callbacks,
		})

		const groupExtra = new BrickGroup(scene, {
			immovable: true,
			classType: ExtraBall,
			maxSize: config.block.max.extra,
			...callbacks,
		})

		const groupLife = new BrickGroup(scene, {
			immovable: true,
			classType: ExtraBall,
			maxSize: config.block.max.life,
			...callbacks,
		})

		this.groups = {
			[BrickType.BRICK]: groupNormal,
			[BrickType.SPECIAL_BALL]: groupSpecial,
			[BrickType.EXTRA_BALL]: groupExtra,
			[BrickType.EXTRA_LIFE]: groupLife,
		}

		return this
	}

	private createSlots() {
		const { rows, cols } = config
		const slots: boolean[][] = []
		for (let row = 0; row < rows; row++) {
			slots[row] = []
			for (let col = 0; col < cols; col++) {
				slots[row][col] = false
			}
		}

		return slots
	}

	getSlots(): boolean[][] {
		const slots = this.createSlots()

		for (const type of this.getBlockTypes()) {
			const t = type as BrickType
			this.groups[t].bricks.forEach((block: BlockTypeClass) => {
				slots[block.row][block.col] = true
			})
		}

		return slots
	}

	private isSlotEmpty(row: number, col: number, slots: boolean[][]) {
		return slots[row] && slots[row][col] === false
	}

	private getBlockTypes() {
		return Object.values(BrickType)
			.filter((e) => !isNaN(Number(e)))
			.map((e) => Number(e))
	}

	private getAvailableSlots(rowStart = 0, rowEnd = -1): { row: number; col: number }[] {
		if (rowStart < 0) rowStart = 0
		if (rowEnd < 0) rowEnd = World.lastRowIndex

		rowStart = Math.min(rowStart, World.lastRowIndex)
		rowEnd = Math.min(rowEnd, World.lastRowIndex)

		const free = []
		const slots = this.getSlots()

		for (let row = rowStart; row <= rowEnd; row++) {
			const usedInRow = slots[row].filter((e) => e).length

			if (usedInRow >= config.block.maxPerRow) continue

			for (let col = 0; col < slots[row].length; col++) {
				if (this.isSlotEmpty(row, col, slots)) free.push({ row: row, col: col })
			}
		}

		return free
	}

	private getRandomFreeSlot(rowStart = 0, rowEnd = -1): { row: number; col: number } {
		const slots = this.getAvailableSlots(rowStart, rowEnd)

		if (!slots.length) return { row: -1, col: -1 }

		const index = Phaser.Math.Between(0, slots.length - 1)
		return slots[index]
	}
}
