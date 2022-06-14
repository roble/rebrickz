import { GameConfig as config } from "@config"
import { Balls } from "./balls"
import { BrickType, ExtraBall, Brick, SpecialBall } from "./brick"
import { BlockTypeClass, BrickGroup } from "./brick-group"
import { World } from "./world"

export type BlockGroup = {
	[key in BrickType]: BrickGroup
}

export class Bricks {
	private scene: Phaser.Scene
	private slots!: boolean[][]
	groups!: BlockGroup
	balls: Balls

	constructor(scene: Phaser.Scene, balls: Balls) {
		this.scene = scene
		this.balls = balls
		this.createGroups(scene)
		this.initSlots()
		this.setCollisionHandler()
	}

	setCollisionHandler(): this {
		const overlap = [this.groups[BrickType.EXTRA_BALL], this.groups[BrickType.SPECIAL_BALL]]
		const collide = this.groups[BrickType.BRICK]

		// collectables bricks
		this.scene.physics.add.overlap(this.balls.group, overlap, (ball, _brick) => {
			// console.log(ball, _brick)
			_brick.destroy(true)
		})

		// collidables bricks
		this.scene.physics.add.collider(this.balls.group, collide, (ball, _brick) => {
			const brick = _brick as Brick
			brick.health.damage()
			// const maxHealth = brick.maxHealth
			_brick.destroy(true)
		})

		return this
	}

	private createCallback(obj: Phaser.GameObjects.GameObject) {
		this.updateSlots()
		return obj //TODO: remove
	}

	private removeCallback(obj: Phaser.GameObjects.GameObject) {
		console.log("remove")
		this.updateSlots()
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
		this.getChildren().forEach(async (brick) => {
			await brick.move()
		})
		return this
	}

	async createRandom(): Promise<this> {
		const total = Phaser.Math.Between(1, config.block.maxPerRow)
		const dropExtraBall = Phaser.Math.Between(0, 100) < 30
		const dropSpecialBall = Phaser.Math.Between(0, 100) < 10

		for (let i = 0; i < total; i++) {
			this.add(BrickType.BRICK)
		}

		if (dropExtraBall) this.add(BrickType.EXTRA_BALL)
		if (dropSpecialBall) this.add(BrickType.SPECIAL_BALL)

		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(this)
			}, 300)
		})
	}

	add(type: BrickType): this {
		const { row, col } = this.getRandomFreeSlot(1, 2)

		if (row === -1) {
			console.warn("No more slots available")
			return this
		}

		switch (type) {
			case BrickType.BRICK:
				this.groups[BrickType.BRICK].add(new Brick(this.scene, { row: row, col: col }), true)
				break
			case BrickType.SPECIAL_BALL:
				this.groups[BrickType.SPECIAL_BALL].add(new SpecialBall(this.scene, { row: row, col: col }), true)
				break
			case BrickType.EXTRA_BALL:
				this.groups[BrickType.EXTRA_BALL].add(new ExtraBall(this.scene, { row: row, col: col }), true)
				break

			default:
				console.warn("Unknown block type ")
				break
		}
		return this
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

		this.groups = {
			[BrickType.BRICK]: groupNormal,
			[BrickType.SPECIAL_BALL]: groupSpecial,
			[BrickType.EXTRA_BALL]: groupExtra,
		}

		return this
	}

	private initSlots(): this {
		const { rows, cols } = config
		const slots: boolean[][] = []
		for (let row = 0; row < rows; row++) {
			slots[row] = []
			for (let col = 0; col < cols; col++) {
				slots[row][col] = false
			}
		}
		this.slots = slots
		return this
	}

	updateSlots(): this {
		this.initSlots()
		for (const type of this.getBlockTypes()) {
			const t = type as BrickType
			this.groups[t].bricks.forEach((block: BlockTypeClass) => {
				this.slots[block.row][block.col] = true
			})
		}

		console.log(this.slots)

		return this
	}

	private isSlotEmpty(row: number, col: number) {
		return !this.slots[row][col]
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

		for (let row = rowStart; row <= rowEnd; row++) {
			const usedInRow = this.slots[row].filter((e) => e).length

			if (usedInRow >= config.block.maxPerRow) continue

			for (let col = 0; col < this.slots[row].length; col++) {
				if (this.isSlotEmpty(row, col)) free.push({ row: row, col: col })
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
