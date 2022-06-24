import { GameConfig as config } from "@config"

import { BrickType, ExtraBall, SpecialBall } from "@rebrickz"

import { Ball } from "./ball"
import { Balls } from "./balls"
import { Brick } from "./brick/brick"
import { BlockTypeClass, BrickGroup } from "./brick-group"
import { ExtraLife } from "./brick/extra-life"
import { Health } from "./brick/health"
import { World } from "./world"

export type BlockGroup = {
	[key in BrickType]: BrickGroup
}

export class Bricks {
	static readonly EVENTS = {
		COLLIDED_WORLD_DOWN: "collided_world_down",
		COLLECTED: "collected",
	}

	private scene: Phaser.Scene
	groups!: BlockGroup
	balls: Balls
	events = new Phaser.Events.EventEmitter()

	constructor(scene: Phaser.Scene, balls: Balls) {
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
			this.events.emit(Bricks.EVENTS.COLLECTED, brick)
		})

		// collidables bricks
		this.scene.physics.collide(this.balls.group, collide, (_ball, _brick) => {
			const brick = _brick as Brick
			const ball = _ball as Ball

			const isCritical = Phaser.Math.FloatBetween(0, 100) < ball.criticalRate
			const isInstantKill = Phaser.Math.FloatBetween(0, 100) < ball.instantKillRate

			if (isCritical) {
				brick.health.damage(Health.DAMAGE_TYPE.CRITICAL)
				return this
			}

			if (isInstantKill) {
				brick.health.damage(Health.DAMAGE_TYPE.INSTANT_KILL)
				return this
			}

			brick.health.damage()
		})

		return this
	}

	destroyRow(rowIndex: number): number {
		const bricks = this.getChildren().filter((brick) => brick.row === rowIndex)
		let count = 0
		bricks.forEach((brick) => {
			switch (brick.brickType) {
				case BrickType.EXTRA_BALL:
				case BrickType.EXTRA_LIFE:
				case BrickType.SPECIAL_BALL:
					this.events.emit(Bricks.EVENTS.COLLECTED, brick)
					break
				default:
					count++
					break
			}
			brick.destroy()
		})

		return count
	}

	createCallback(obj: Phaser.GameObjects.GameObject) {
		obj.on(Health.EVENTS.DAMAGE, (damage: number) => {
			this.events.emit(Health.EVENTS.DAMAGE, damage)
		})

		return obj
	}

	removeCallback(obj: Phaser.GameObjects.GameObject) {
		obj.off(Health.EVENTS.DAMAGE)
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
		if (inLastRow.length) this.events.emit(Bricks.EVENTS.COLLIDED_WORLD_DOWN)

		return Promise.all(bricksToMove.map((brick) => brick.moveDown())).then(() => {
			return this
		})
	}

	async createRandom(level: number): Promise<this> {
		const total = Phaser.Math.Between(1, config.brick.maxPerRow)
		const dropExtraBall = Phaser.Math.Between(0, 100) < config.brick.dropProbability.extra
		const dropSpecialBall = Phaser.Math.Between(0, 100) < config.brick.dropProbability.special
		const dropLife = Phaser.Math.Between(0, 100) < config.brick.dropProbability.life

		const bricks = []

		if (this.balls.group.getTotalFree()) {
			if (dropExtraBall) {
				bricks.push(this.add(BrickType.EXTRA_BALL))
			}

			if (dropSpecialBall) {
				bricks.push(this.add(BrickType.SPECIAL_BALL))
			}
		}

		if (dropLife) {
			bricks.push(this.add(BrickType.EXTRA_LIFE))
		}

		for (let i = 0; i < total; i++) {
			bricks.push(this.add(BrickType.BRICK, level))
		}

		return Promise.all(bricks).then(() => this)
	}

	async add(type: BrickType, level?: number): Promise<this> {
		switch (type) {
			case BrickType.BRICK: {
				const { min, max } = config.brick.dropOnRows.normal
				const { row, col } = this.getRandomFreeSlot(min, max)

				if (row === -1) {
					return new Promise((resolve) => resolve(this))
				}

				const brick = new Brick(this.scene, {
					row: row,
					col: col,
					level: level ? Math.pow(level, config.brick.levelIncrement) : 1,
				})
				this.groups[BrickType.BRICK].add(brick, true)

				break
			}

			case BrickType.SPECIAL_BALL: {
				const { min, max } = config.brick.dropOnRows.special
				const { row, col } = this.getRandomFreeSlot(min, max)

				if (row === -1) {
					return new Promise((resolve) => resolve(this))
				}
				this.groups[BrickType.SPECIAL_BALL].add(new SpecialBall(this.scene, { row: row, col: col }), true)
				break
			}
			case BrickType.EXTRA_BALL: {
				const { min, max } = config.brick.dropOnRows.extra
				const { row, col } = this.getRandomFreeSlot(min, max)

				if (row === -1) {
					return new Promise((resolve) => resolve(this))
				}
				this.groups[BrickType.EXTRA_BALL].add(new ExtraBall(this.scene, { row: row, col: col }), true)
				break
			}
			case BrickType.EXTRA_LIFE: {
				const { min, max } = config.brick.dropOnRows.life
				const { row, col } = this.getRandomFreeSlot(min, max)

				if (row === -1) {
					return new Promise((resolve) => resolve(this))
				}
				this.groups[BrickType.EXTRA_LIFE].add(new ExtraLife(this.scene, { row: row, col: col }), true)
				break
			}
			default:
				console.warn("Unknown block type ")
				break
		}

		const { delay, duration } = config.brick.tweens.fall

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
			maxSize: config.brick.max.normal,
			...callbacks,
		})

		const groupSpecial = new BrickGroup(scene, {
			immovable: true,
			classType: SpecialBall,
			maxSize: config.brick.max.special,
			...callbacks,
		})

		const groupExtra = new BrickGroup(scene, {
			immovable: true,
			classType: ExtraBall,
			maxSize: config.brick.max.extra,
			...callbacks,
		})

		const groupLife = new BrickGroup(scene, {
			immovable: true,
			classType: ExtraBall,
			maxSize: config.brick.max.life,
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

			if (usedInRow >= config.brick.maxPerRow) continue

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
