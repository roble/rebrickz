import { GameConfig as config } from "@config"
import * as Rebrickz from "@rebrickz"

enum State {
	AIMING,
	WAITING,
}

type SideNames = "left" | "top" | "right"
interface CollisionSide {
	point: Phaser.Math.Vector3 | undefined
	side: SideNames | undefined
}
export class Trajectory extends Phaser.Events.EventEmitter {
	scene: Phaser.Scene
	direction!: number
	angle!: number
	state = State.WAITING
	active = false
	x: number
	y: number
	trajectoryLine!: Phaser.Geom.Line
	trajectoryLineLeft!: Phaser.Geom.Line
	trajectoryLineRight!: Phaser.Geom.Line
	graphTrajectory!: Phaser.GameObjects.Graphics
	graphTrajectoryLeft!: Phaser.GameObjects.Graphics
	graphTrajectoryRight!: Phaser.GameObjects.Graphics
	graphPivotBall!: Phaser.GameObjects.Graphics
	world!: Rebrickz.World
	blockBounds!: Phaser.Geom.Rectangle[]
	collisionPointSprite!: Phaser.GameObjects.Sprite
	collisionPoint!: Phaser.Geom.Point | undefined
	arrowBallSprite!: Phaser.GameObjects.Sprite
	trajectoryRectangle!: Phaser.GameObjects.Rectangle

	constructor(scene: Phaser.Scene, world: Rebrickz.World, x: number, y: number) {
		super()
		this.scene = scene
		this.world = world
		this.x = x
		this.y = y
		this.create()
	}

	setActive(value?: boolean): this {
		this.active = value === undefined ? !this.active : value
		if (!this.active) {
			this.state = State.WAITING
		}
		return this
	}

	setPosition(x: number): this {
		this.x = x
		this.arrowBallSprite.x = x
		this.trajectoryRectangle.x = x
		return this
	}

	setBlockBounds(blockBounds: Phaser.Geom.Rectangle[]): this {
		this.blockBounds = blockBounds
		return this
	}

	private create() {
		this.emit("created")
		this.addEventListeners()
		this.createGraphics()
		this.createCollisionPoint()
		this.createArrowBall()
		this.createTrajectoryRectangle()
	}

	private createTrajectoryRectangle() {
		this.trajectoryRectangle = this.scene.add.rectangle(this.x, this.y, config.ball.size, config.height, 0xffffff, 0.15)
		this.trajectoryRectangle.setOrigin(0.5, 1)
		this.trajectoryRectangle.visible = false

		const shape = this.scene.add.graphics()

		shape.alpha = 0
		shape.beginPath()

		const { bounds } = this.world
		shape.fillRect(bounds.left, bounds.top, bounds.width, this.world.getBoundsBottom())
		this.trajectoryRectangle.setMask(shape.createGeometryMask())
	}

	private createGraphics(): void {
		this.graphTrajectory = this.scene.add.graphics()
		this.graphTrajectoryLeft = this.scene.add.graphics()
		this.graphTrajectoryRight = this.scene.add.graphics()
		this.graphPivotBall = this.scene.add.graphics()
	}

	private addEventListeners() {
		/**
		 *  Input listeners
		 */
		this.scene.input.on("pointerup", this.mouseUp, this)
		this.scene.input.on("pointerdown", this.mouseDown, this)
		this.scene.input.on("pointermove", this.mouseMove, this)
	}

	private mouseUp(event: PointerEvent) {
		this.clearTrajectory()

		if (!this.direction || this.state !== State.AIMING) {
			this.state = State.WAITING
			return
		}

		this.state = State.WAITING
		this.emit("fire", this.direction)
	}

	private mouseDown(event: PointerEvent) {
		if (!this.active || this.state !== State.WAITING) return

		this.state = State.AIMING
		console.log("start aim")
	}

	private mouseMove(event: any) {
		if (this.state !== State.AIMING) return

		this.clearTrajectory()

		if (!this.canAdjustAim(event)) {
			this.state = State.WAITING
			this.clearTrajectory()
			return
		}

		const { trajectoryDistance, ball } = config

		let distX = event.worldX
		let distY = event.worldY

		this.angle = Phaser.Math.Angle.Between(this.x, this.y, event.worldX, event.worldY)
		this.direction = Phaser.Math.Angle.Wrap(this.angle)

		const cos = (distX + trajectoryDistance) * Math.cos(this.angle)
		const sin = (distY + trajectoryDistance) * Math.sin(this.angle)
		const pivotLine = this.getPivotLine()

		this.trajectoryLine = new Phaser.Geom.Line(this.x, this.y, cos, sin)
		this.trajectoryLineLeft = new Phaser.Geom.Line(pivotLine.x1, pivotLine.y1, cos, sin)
		this.trajectoryLineRight = new Phaser.Geom.Line(pivotLine.x2, pivotLine.y2, cos, sin)

		this.checkDummyArea()

		// cancel aiming if mouse position is
		// greater then the world and dummy area
		if (event.y > this.world.getBoundsBottom()) {
			this.state = State.WAITING
			this.clearTrajectory()
			return
		}

		this.intersectTrajectoryToWorld()

		this.fixDirection()

		this.checkBlocksCollisions()

		this.showCollisionPoint()

		this.showArrowBall()

		this.showTrajectory()
	}

	private checkBlocksCollisions() {

		const getClosestCollision = (line: Phaser.Geom.Line) => {

			let collisions = this.blockBounds.map(
				(rect) => Phaser.Geom.Intersects.GetLineToRectangle(line, rect)
			).filter(e => e.length)

			let closest
			for (const arr of collisions) {
				if (!closest) closest = arr
				// bottom is closer then the sides
				if (arr[1] && closest[1] && arr[1].y > closest[1].y) closest = arr
			}
			if (closest)
				return closest[0].y > closest[1].y ? closest[0] : closest[1]

			return false
		}

		const center = getClosestCollision(this.trajectoryLine)
		const left = getClosestCollision(this.trajectoryLineLeft)
		const right = getClosestCollision(this.trajectoryLineRight)

		if (!center && !left && !right) {
			this.collisionPoint = undefined
			return
		}

		let closest = [center, left, right]
			.reduce((prev, current) => (prev.y > current.y) ? prev : current, [])

		console.log(center, left, right)
		console.log(closest)

		this.collisionPoint = new Phaser.Geom.Point(closest.x, closest.y)

	}

	private canAdjustAim(event: any): boolean {
		return this.scene.input.activePointer.leftButtonDown() && event.y < this.world.getBoundsBottom()
	}

	private createCollisionPoint(): void {
		this.collisionPointSprite = this.scene.add.sprite(-50, -50, "collision")
		this.collisionPointSprite.visible = false
		this.scene.tweens.add({
			targets: this.collisionPointSprite,
			props: {
				angle: { value: "+=360" },
			},
			duration: 3000,
			repeat: -1,
			ease: "Linear",
		})
	}
	private createArrowBall(): void {
		this.arrowBallSprite = this.scene.add.sprite(this.x, this.y - config.ball.size, "arrow_ball")
		this.arrowBallSprite.visible = false
		this.arrowBallSprite.setOrigin(0.5, 1)
		this.scene.tweens.add({
			targets: this.arrowBallSprite,
			duration: 600,
			alpha: { from: 0.3, to: 0.7 },
			scale: { from: 0.9, to: 1.1 },
			onUpdate: (tween) => {
				this.arrowBallSprite.rotation = this.direction + Math.PI / 2
			},
			yoyo: true,
			repeat: -1,
			ease: "Power1",
		})
	}

	private showCollisionPoint(): void {
		this.collisionPointSprite.visible = true

		if (this.collisionPoint) {
			this.collisionPointSprite.x = this.collisionPoint.x
			this.collisionPointSprite.y = this.collisionPoint.y
			return
		}

		let cos = Math.cos(this.direction)
		let sin = Math.sin(this.direction)

		const size = this.collisionPointSprite.width
		const radius = size / 2

		// adjusted for top world side
		let x = this.trajectoryLine.x2 - cos * radius
		let y = this.trajectoryLine.y2 - sin * radius


		this.collisionPointSprite.x = x
		this.collisionPointSprite.y = y
	}

	private showArrowBall(): void {
		let cos = Math.cos(this.direction)
		let sin = Math.sin(this.direction)

		let x = this.trajectoryLine.x1 + cos * config.ball.size
		let y = this.trajectoryLine.y1 + sin * config.ball.size

		this.arrowBallSprite.visible = true
		this.arrowBallSprite.rotation = this.direction + Math.PI / 2
		this.arrowBallSprite.x = x
		this.arrowBallSprite.y = y
	}

	private fixDirection(): void {
		this.angle = Phaser.Math.Angle.Between(this.x, this.y, this.trajectoryLine.x2, this.trajectoryLine.y2)
		this.direction = Phaser.Math.Angle.Wrap(this.angle)
	}

	private intersectTrajectoryToWorld(): void {
		const lineLeft = this.getWorldIntersection(this.trajectoryLineLeft)
		const lineCenter = this.getWorldIntersection(this.trajectoryLine)
		const lineRight = this.getWorldIntersection(this.trajectoryLineRight)

		if (lineLeft.point) {
			this.trajectoryLineLeft.x2 = lineLeft.point.x
			this.trajectoryLineLeft.y2 = lineLeft.point.y
		}
		if (lineCenter.point) {
			this.trajectoryLine.x2 = lineCenter.point.x
			this.trajectoryLine.y2 = lineCenter.point.y
		}
		if (lineRight.point) {
			this.trajectoryLineRight.x2 = lineRight.point.x
			this.trajectoryLineRight.y2 = lineRight.point.y
		}
	}

	private checkDummyArea(): void {
		const bounds = this.world.getBounds()

		const collideLeft = Phaser.Geom.Intersects.LineToLine(this.trajectoryLine, this.getDummyLeftLine())

		if (collideLeft) {
			this.trajectoryLine.x2 = bounds.x
			this.trajectoryLine.y2 = bounds.y + bounds.height
			return
		}

		const collideRight = Phaser.Geom.Intersects.LineToLine(this.trajectoryLine, this.getDummyRightLine())

		if (collideRight) {
			this.trajectoryLine.x2 = bounds.x + bounds.width
			this.trajectoryLine.y2 = bounds.y + bounds.height
			return
		}
	}

	private getDummyRightLine(): Phaser.Geom.Line {
		return new Phaser.Geom.Line(
			this.world.getBounds().x + this.world.getBounds().width,
			this.world.getBounds().y + this.world.getBounds().height,
			this.world.getBounds().x + this.world.getBounds().width,
			this.world.getBoundsBottom() + 2 // 2 is to fix 1 pixel bug on very bottom
		)
	}

	private getDummyLeftLine(): Phaser.Geom.Line {
		return new Phaser.Geom.Line(
			this.world.getBounds().x,
			this.world.getBounds().y + this.world.getBounds().height,
			this.world.getBounds().x,
			this.world.getBoundsBottom() + 2 // 2 is to fix 1 pixel bug on very bottom
		)
	}

	private getWorldIntersection(line: Phaser.Geom.Line): CollisionSide {
		const { left, top, right } = this.world.getSides()

		const result: CollisionSide = {
			point: undefined,
			side: undefined,
		}

		const collideLeft = Phaser.Geom.Intersects.GetLineToLine(line, left)
		if (collideLeft) {
			result.point = collideLeft
			result.side = "left"
		}

		const collideTop = Phaser.Geom.Intersects.GetLineToLine(line, top)
		if (collideTop) {
			result.point = collideTop
			result.side = "top"
		}

		const collideRight = Phaser.Geom.Intersects.GetLineToLine(line, right)
		if (collideRight) {
			result.point = collideRight
			result.side = "right"
		}

		return result
	}

	private getPivotLine(): Phaser.Geom.Line {
		const pivot = new Phaser.Geom.Line(this.x - config.ball.radius, this.y, this.x + config.ball.radius, this.y)

		return Phaser.Geom.Line.Rotate(pivot, this.direction + Math.PI / 2)
	}

	private showTrajectory() {
		this.trajectoryRectangle.visible = true
		this.trajectoryRectangle.rotation = this.direction + Math.PI / 2

		return

		/**
		 * Debug
		 */
		let pivotLine = this.getPivotLine()

		this.graphPivotBall
			.lineStyle(1, 0x00ff00)
			.fillStyle(0xff1111)
			.setDepth(100)
			.lineBetween(pivotLine.x1, pivotLine.y1, pivotLine.x2, pivotLine.y2)

		this.graphTrajectory
			.lineStyle(1, 0x00ff00)
			.fillStyle(0xff0000)
			.setDepth(100)
			.lineBetween(this.trajectoryLine.x1, this.trajectoryLine.y1, this.trajectoryLine.x2, this.trajectoryLine.y2)

		this.graphTrajectoryLeft
			.lineStyle(1, 0x00ff00)
			.fillStyle(0xff0000)
			.setDepth(100)
			.lineBetween(
				this.trajectoryLineLeft.x1,
				this.trajectoryLineLeft.y1,
				this.trajectoryLineLeft.x2,
				this.trajectoryLineLeft.y2
			)

		this.graphTrajectoryRight
			.lineStyle(1, 0x00ff00)
			.fillStyle(0xff0000)
			.setDepth(100)
			.lineBetween(
				this.trajectoryLineRight.x1,
				this.trajectoryLineRight.y1,
				this.trajectoryLineRight.x2,
				this.trajectoryLineRight.y2
			)
	}

	private clearTrajectory() {
		this.collisionPointSprite.visible = false
		this.arrowBallSprite.visible = false
		this.trajectoryRectangle.visible = false
		this.graphTrajectory.clear()
		this.graphTrajectoryLeft.clear()
		this.graphTrajectoryRight.clear()
		this.graphPivotBall.clear()
	}
}
