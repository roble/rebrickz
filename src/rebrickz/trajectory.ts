import { GameConfig as config } from "@config"
import * as Rebrickz from "@rebrickz"
import { Sides } from "./world"

enum State {
    AIMING,
    WAITING
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
    collisionPoint!: Phaser.GameObjects.Sprite

    constructor(
        scene: Phaser.Scene,
        world: Rebrickz.World,
        x: number,
        y: number) {
        super()
        this.scene = scene
        this.world = world
        this.x = x
        this.y = y
        this.create()
    }

    getCollisionPoint() {
        return this.collisionPoint
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
        return this
    }

    create() {
        this.emit('created')
        this.addEventListeners()
        this.createGraphics()
        this.createCollisionPoint()

        // TODO: remove
        this.setActive(true)
    }

    private createGraphics(): void {
        this.graphTrajectory = this.scene.add.graphics()
        this.graphTrajectoryLeft = this.scene.add.graphics()
        this.graphTrajectoryRight = this.scene.add.graphics()
        this.graphPivotBall = this.scene.add.graphics()
    }

    addEventListeners() {
        /**
         *  Input listeners
         */
        this.scene.input.on("pointerup", this.mouseUp, this)
        this.scene.input.on("pointerdown", this.mouseDown, this)
        this.scene.input.on("pointermove", this.mouseMove, this)
    }

    mouseUp(event: PointerEvent) {

        this.clearTrajectory()

        if (!this.direction || this.state !== State.AIMING) {
            this.state = State.WAITING
            return
        }

        this.state = State.WAITING
        this.emit('fire', this.direction)
    }

    mouseDown(event: PointerEvent) {
        if (!this.active || this.state !== State.WAITING) return

        this.state = State.AIMING
        console.log('start aim')
    }


    mouseMove(event: any) {

        if (this.state !== State.AIMING) return

        this.clearTrajectory()

        if (!this.canAdjustAim(event)) {
            this.state = State.WAITING
            this.clearTrajectory()
            return
        }

        const { trajectoryDistance, ball } = config

        let distX = event.worldX;
        let distY = event.worldY;

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

        this.showCollisionPoint()

        this.showTrajectory()

    }

    canAdjustAim(event: any): boolean {
        return this.scene.input.activePointer.leftButtonDown() && event.y < this.world.getBoundsBottom()
    }

    private createCollisionPoint(): void {

        this.collisionPoint = this.scene.add.sprite(-50, -50, "collision")
        this.collisionPoint.visible = false
        this.scene.tweens.add({
            targets: this.collisionPoint,
            props: {
                angle: { value: "+=360" },
            },
            duration: 3000,
            repeat: -1,
            ease: "Linear",
        })
        this.collisionPoint.setSize(1, 1)
        this.scene.physics.add.existing(this.collisionPoint)
        //@ts-ignore
        this.collisionPoint.body.setCollideWorldBounds(true);

    }

    private showCollisionPoint(): void {
        this.collisionPoint.visible = true
        this.collisionPoint.x = this.trajectoryLine.x2
        this.collisionPoint.y = this.trajectoryLine.y2
    }

    private fixDirection(): void {
        this.angle = Phaser.Math.Angle.Between(this.x, this.y, this.trajectoryLine.x2, this.trajectoryLine.y2)
        this.direction = Phaser.Math.Angle.Wrap(this.angle)
    }

    private intersectTrajectoryToWorld(): void {

        const lineLeft = this.getWorldIntersection(this.trajectoryLineLeft)
        const lineCenter = this.getWorldIntersection(this.trajectoryLine)
        const lineRight = this.getWorldIntersection(this.trajectoryLineRight)

        if (typeof lineLeft !== "boolean") {
            this.trajectoryLineLeft.x2 = lineLeft.x
            this.trajectoryLineLeft.y2 = lineLeft.y
        }
        if (typeof lineCenter !== "boolean") {
            this.trajectoryLine.x2 = lineCenter.x
            this.trajectoryLine.y2 = lineCenter.y
        }
        if (typeof lineRight !== "boolean") {
            this.trajectoryLineRight.x2 = lineRight.x
            this.trajectoryLineRight.y2 = lineRight.y
        }


    }

    private checkDummyArea(): void {

        const bounds = this.world.getBounds()

        const collideLeft = Phaser.Geom.Intersects.LineToLine(
            this.trajectoryLine,
            this.getDummyLeftLine()
        )

        if (collideLeft) {
            this.trajectoryLine.x2 = bounds.x
            this.trajectoryLine.y2 = bounds.y + bounds.height
            return
        }

        const collideRight = Phaser.Geom.Intersects.LineToLine(
            this.trajectoryLine,
            this.getDummyRightLine()
        )

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

    private getWorldIntersection(line: Phaser.Geom.Line): boolean | Phaser.Math.Vector3 {
        const { left, top, right } = this.world.getSides()

        const collideLeft = Phaser.Geom.Intersects.GetLineToLine(line, left)
        if (collideLeft)
            return collideLeft

        const collideTop = Phaser.Geom.Intersects.GetLineToLine(line, top)
        if (collideTop)
            return collideTop

        const collideRight = Phaser.Geom.Intersects.GetLineToLine(line, right)
        if (collideRight)
            return collideRight


        return false
    }

    getPivotLine(): Phaser.Geom.Line {
        const ballSize = config.ball.size
        const ballRadius = ballSize / 2
        const pivot = new Phaser.Geom.Line(
            this.x - ballRadius,
            this.y,
            this.x + ballRadius,
            this.y)

        return Phaser.Geom.Line.Rotate(pivot, this.direction + Math.PI / 2)
    }

    private showTrajectory() {

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
            .lineBetween(
                this.trajectoryLine.x1,
                this.trajectoryLine.y1,
                this.trajectoryLine.x2,
                this.trajectoryLine.y2
            )

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
        this.collisionPoint.visible = false
        this.graphTrajectory.clear()
        this.graphTrajectoryLeft.clear()
        this.graphTrajectoryRight.clear()
        this.graphPivotBall.clear()
    }




}