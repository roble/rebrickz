import { GameConfig as config } from "@config"
import * as Rebrickz from "@rebrickz"

enum State {
	AIMING,
	WAITING,
}
interface Vertices {
	[key: string]: Phaser.Geom.Point
}
export class Trajectory {
	static readonly EVENTS = {
		FIRE: "fire",
		CREATED: "created",
	}

	events = new Phaser.Events.EventEmitter()

	private scene: Phaser.Scene
	private direction!: number
	private angle!: number
	private state = State.WAITING
	private active = false
	private x!: number
	private y!: number
	private trajectoryLine!: Phaser.Geom.Line
	private graphics!: Phaser.GameObjects.Graphics
	private world!: Rebrickz.World
	private collidableLines!: Phaser.Geom.Line[]
	private collisionPointSprite!: Phaser.GameObjects.Sprite
	private collisionPoint!: Phaser.Geom.Point | undefined
	private arrowBallSprite!: Phaser.GameObjects.Sprite
	private trajectoryRectangle!: Phaser.GameObjects.Rectangle

	constructor(scene: Phaser.Scene, world: Rebrickz.World) {
		this.scene = scene
		this.world = world

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

	getPosition(): { x: number; y: number } {
		return { x: this.x, y: this.y }
	}

	setCollidableLines(lines: Phaser.Geom.Line[]): this {
		this.collidableLines = lines
		return this
	}

	private create() {
		this.events.emit(Trajectory.EVENTS.CREATED)
		this.moveToInitialPosition()
		this.addEventListeners()
		this.createGraphics()
		this.createCollisionPointSprite()
		this.createArrowBallSprite()
		this.createTrajectoryRectangle()
	}

	private moveToInitialPosition() {
		const x = this.world.getBounds().centerX
		const y = this.world.getBoundsBottom() - config.ball.radius

		this.x = x
		this.y = y
	}

	private createTrajectoryRectangle() {
		this.trajectoryRectangle = this.scene.add.rectangle(
			this.x,
			this.y,
			config.ball.size + 2,
			config.height,
			0xffffff,
			0.05
		)
		this.trajectoryRectangle.setOrigin(0.5, 1)
		this.trajectoryRectangle.visible = false
		this.trajectoryRectangle.setBlendMode(Phaser.BlendModes.ADD)

		const shape = this.scene.add.graphics()

		shape.alpha = 0
		shape.beginPath()

		const { bounds } = this.world
		shape.fillRect(bounds.left, bounds.top, bounds.width, this.world.getBoundsBottom())
		this.trajectoryRectangle.setMask(shape.createGeometryMask())
	}

	private createGraphics(): void {
		this.graphics = this.scene.add.graphics()
	}

	private addEventListeners() {
		/**
		 *  Input listeners
		 */
		this.scene.input.on("pointerup", this.mouseUp, this)
		this.scene.input.on("pointerdown", this.mouseDown, this)
		this.scene.input.on("pointermove", this.mouseMove, this)
	}

	private mouseUp() {
		this.clearTrajectory()

		if (!this.direction || this.state !== State.AIMING) {
			this.state = State.WAITING
			return
		}

		this.state = State.WAITING
		this.events.emit(Trajectory.EVENTS.FIRE, this.direction)
	}

	private mouseDown() {
		if (!this.active || this.state !== State.WAITING) return

		this.state = State.AIMING
	}

	private mouseMove(event: Phaser.Input.Pointer) {
		if (this.state !== State.AIMING) return

		this.clearTrajectory()

		if (!this.canAdjustAim(event)) {
			this.state = State.WAITING
			this.clearTrajectory()
			return
		}

		const { trajectoryDistance } = config

		const distX = event.worldX
		const distY = event.worldY

		this.angle = Phaser.Math.Angle.Between(this.x, this.y, event.worldX, event.worldY)
		this.direction = Phaser.Math.Angle.Wrap(this.angle)

		const cos = (distX + trajectoryDistance) * Math.cos(this.angle)
		const sin = (distY + trajectoryDistance) * Math.sin(this.angle)

		this.trajectoryLine = new Phaser.Geom.Line(this.x, this.y, cos, sin)

		this.checkDummyArea()

		// cancel aiming if mouse position is
		// greater then the world and dummy area
		if (event.y > this.world.getBoundsBottom()) {
			this.state = State.WAITING
			this.clearTrajectory()
			return
		}

		this.fixDirection()
		this.checkBlocksCollisions()
		this.showCollisionPoint()
		this.showArrowBall()
		this.showTrajectory()
	}

	private getDirectionRotated() {
		return this.direction + Math.PI / 2
	}

	private checkBlocksCollisions() {
		const lines = this.getLinesFromVertices()
		const closest: {
			distance: number
			point: Phaser.Geom.Point
			vertex: string | undefined
		} = {
			distance: Number.MAX_SAFE_INTEGER,
			point: new Phaser.Geom.Point(-1, -1),
			vertex: undefined,
		}

		this.collisionPoint = new Phaser.Geom.Point(-100, -100)

		lines.forEach((vertex) => {
			this.collidableLines.forEach((line) => {
				const point = new Phaser.Geom.Point(-1, -1)

				Phaser.Geom.Intersects.LineToLine(line, vertex.line, point)
				if (point.x !== -1) {
					const vertexPoint = new Phaser.Geom.Point(vertex.line.x1, vertex.line.y1)
					const distance = Phaser.Math.Distance.BetweenPoints(vertexPoint, point)

					if (distance > 0 && distance < closest.distance) {
						closest.point = point
						closest.distance = distance
						closest.vertex = vertex.pos
					}
				}
			})
		})
		if (closest.vertex) {
			const { radius } = config.ball

			switch (closest.vertex) {
				case "top_left":
					this.trajectoryLine.x2 = closest.point.x + radius
					this.trajectoryLine.y2 = closest.point.y + radius
					break
				case "top_right":
					this.trajectoryLine.x2 = closest.point.x - radius
					this.trajectoryLine.y2 = closest.point.y + radius
					break
				case "bottom_right":
					this.trajectoryLine.x2 = closest.point.x - radius
					this.trajectoryLine.y2 = closest.point.y - radius
					break
				case "bottom_left":
					this.trajectoryLine.x2 = closest.point.x + radius
					this.trajectoryLine.y2 = closest.point.y - radius
					break
			}

			const points = Phaser.Geom.Line.BresenhamPoints(this.trajectoryLine, 2)
			if (points.length) {
				const newPoint = points[points.length - 1]
				this.collisionPoint = new Phaser.Geom.Point(newPoint.x, newPoint.y)
				this.trajectoryLine.x2 = newPoint.x || 0
				this.trajectoryLine.y2 = newPoint.y || 0
			}
		}
	}

	private canAdjustAim(event: Phaser.Input.Pointer): boolean {
		return this.scene.input.activePointer.leftButtonDown() && event.y < this.world.getBoundsBottom()
	}

	private createCollisionPointSprite(): void {
		this.collisionPointSprite = this.scene.add.sprite(-50, -50, "collision")
		this.collisionPointSprite.visible = false
		this.collisionPointSprite.setDepth(1000)
		this.scene.physics.add.existing(this.collisionPointSprite)
		this.scene.tweens.add({
			targets: this.collisionPointSprite,
			props: {
				angle: { value: "+=360" },
			},
			duration: 2000,
			repeat: -1,
			ease: "Linear",
		})
	}

	private createArrowBallSprite(): void {
		this.arrowBallSprite = this.scene.add.sprite(this.x, this.y - config.ball.size, "arrow_ball")
		this.arrowBallSprite.visible = false
		this.arrowBallSprite.setOrigin(0.5, 1)
		this.scene.tweens.add({
			targets: this.arrowBallSprite,
			duration: 600,
			alpha: { from: 0.3, to: 0.7 },
			scale: { from: 0.9, to: 1.1 },
			onUpdate: () => {
				this.arrowBallSprite.rotation = this.getDirectionRotated()
			},
			yoyo: true,
			repeat: -1,
			ease: "Power1",
		})
	}

	private showCollisionPoint(): void {
		if (!this.collisionPoint || this.collisionPoint.x < 0) return

		this.collisionPointSprite.visible = true
		this.collisionPointSprite.x = this.collisionPoint.x
		this.collisionPointSprite.y = this.collisionPoint.y
	}

	private showArrowBall(): void {
		const cos = Math.cos(this.direction)
		const sin = Math.sin(this.direction)

		const x = this.trajectoryLine.x1 + cos * config.ball.size
		const y = this.trajectoryLine.y1 + sin * config.ball.size

		this.arrowBallSprite.visible = true
		this.arrowBallSprite.rotation = this.getDirectionRotated()
		this.arrowBallSprite.x = x
		this.arrowBallSprite.y = y
	}

	private fixDirection(): void {
		this.angle = Phaser.Math.Angle.Between(this.x, this.y, this.trajectoryLine.x2, this.trajectoryLine.y2)
		this.direction = Phaser.Math.Angle.Wrap(this.angle)
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
			this.world.getBoundsBottom() + 4 // 4 is to fix 1 pixel bug on very bottom
		)
	}

	private getDummyLeftLine(): Phaser.Geom.Line {
		return new Phaser.Geom.Line(
			this.world.getBounds().x,
			this.world.getBounds().y + this.world.getBounds().height,
			this.world.getBounds().x,
			this.world.getBoundsBottom() + 4 // 4 is to fix 1 pixel bug on very bottom
		)
	}

	private getVertices(): Vertices {
		const distance = config.ball.radius - 1
		return {
			top_left: new Phaser.Geom.Point(this.x - distance, this.y - distance),
			top_right: new Phaser.Geom.Point(this.x + distance, this.y - distance),
			bottom_left: new Phaser.Geom.Point(this.x - distance, this.y + distance),
			bottom_right: new Phaser.Geom.Point(this.x + distance, this.y + distance),
		}
	}

	private getLinesFromVertices(): { pos: string; line: Phaser.Geom.Line }[] {
		const { radius } = config.ball
		const vertices = this.getVertices()

		return [
			{
				pos: "top_left",
				line: new Phaser.Geom.Line(
					vertices.top_left.x,
					vertices.top_left.y,
					this.trajectoryLine.x2 - radius,
					this.trajectoryLine.y2 - radius
				),
			},
			{
				pos: "top_right",
				line: new Phaser.Geom.Line(
					vertices.top_right.x,
					vertices.top_right.y,
					this.trajectoryLine.x2 + radius,
					this.trajectoryLine.y2 - radius
				),
			},
			{
				pos: "bottom_left",
				line: new Phaser.Geom.Line(
					vertices.bottom_left.x,
					vertices.bottom_left.y,
					this.trajectoryLine.x2 - radius,
					this.trajectoryLine.y2 + radius
				),
			},
			{
				pos: "bottom_right",
				line: new Phaser.Geom.Line(
					vertices.bottom_right.x,
					vertices.bottom_right.y,
					this.trajectoryLine.x2 + radius,
					this.trajectoryLine.y2 + radius
				),
			},
		]
	}

	private showTrajectory() {
		this.trajectoryRectangle.visible = true
		this.trajectoryRectangle.rotation = this.getDirectionRotated()

		/**
		 * Debug
		 **/

		if (!this.scene.game.config.physics.arcade?.debug) return

		this.graphics.lineStyle(1, 0x00ff00).fillStyle(0xff1111).setDepth(100)

		this.graphics.lineBetween(
			this.trajectoryLine.x1,
			this.trajectoryLine.y1,
			this.trajectoryLine.x2,
			this.trajectoryLine.y2
		)
		this.getLinesFromVertices().forEach((e) => {
			const { x1, y1, x2, y2 } = e.line
			this.graphics.lineBetween(x1, y1, x2, y2)
		})
	}

	private clearTrajectory() {
		this.collisionPointSprite.visible = false
		this.arrowBallSprite.visible = false
		this.trajectoryRectangle.visible = false
		this.graphics.clear()
	}
}
