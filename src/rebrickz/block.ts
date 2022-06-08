import { GameConfigType } from "@config"
import { applyMixins } from "@helpers"
import { MainScene } from "@scenes/MainScene"

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

    interface HasConfig {
        config: GameConfigType
    }
    interface MoveableInterface {
        get lastRowIndex(): number
        get lastColIndex(): number
        followPosition: any[]
        move(row?: number, col?: number): this
        moveDown(rows: number): this
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
    class Moveable extends Phaser.Physics.Arcade.Sprite implements MoveableInterface, HasConfig {
        config!: GameConfigType
        followPosition: any[] = []

        get lastRowIndex(): number {
            return this.config.rows - 1
        }
        get lastColIndex(): number {
            return this.config.cols - 1
        }

        private animate(args: object) {
            this.scene?.tweens.add({
                targets: [this, ...this.followPosition],
                ...args,
            })
        }

        move(row?: number, col?: number): this {
            console.log("move")
            return this
        }

        moveDown(rows: number): this {
            console.log("move down")
            return this
        }

        canMove(row?: number | undefined, col?: number | undefined): boolean {
            if (!row && !col) return false
            let flag = false
            if (row !== undefined && (row < 0 || row + 1 >= this.lastRowIndex)) flag = true
            if (col !== undefined && (col < 0 || col + 1 >= this.lastColIndex)) flag = true

            return flag
        }

        fall(): this {
            console.log("fall")
            const { initialPositionY, tweens } = this.config.block

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
                        y: 200,
                    },
                ],
            })
            return this
        }
    }
    class Damageable extends Phaser.Physics.Arcade.Sprite implements DamageableInterface, HasConfig {
        _level!: number
        config!: GameConfigType
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
    export class BaseBlock extends Phaser.Physics.Arcade.Sprite implements Interface, HasConfig {
        config: GameConfigType
        col!: number
        row!: number
        level!: number
        blockType!: Type

        constructor(scene: MainScene, options: Options) {
            const { row, col, texture } = options || {}
            const { size, defaultTexture } = scene.config.block
            const x = row ? row * size : 0
            const y = col ? col * size : 0

            super(scene, x, y, texture ?? defaultTexture)
            this.config = scene.config
            this.followPosition = []
        }

        boot(): this {
            console.log("boot base")
            this.on("addedtoscene", this.create, this)
            return this
        }

        getBody(): Phaser.Physics.Arcade.Body {
            return this.body as Phaser.Physics.Arcade.Body
        }

        create() {
            console.log("added to scene")
            const { initialAlpha, initialDepth, initialScale } = this.config.block
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
        constructor(scene: MainScene, options: Options) {
            super(scene, { ...options, texture: "block" })
            this.blockType = Type.NORMAL
            this.boot()
        }

        boot(): this {
            console.log("boot normal")
            super.boot()
            this.textObject = this.scene.add.text(
                this.x,
                this.config.block.initialPositionY,
                this.health?.toString(),
                this.config.block.text.style
            )
            this.textObject.setAlpha(0)
            this.textObject.setDepth(this.depth + 1)
            this.textObject.setOrigin(0.5)
            this.followPosition.push(this.textObject)

            this.render()

            return this
        }
    }

    export class SpecialBall extends BaseBlock {
        constructor(scene: MainScene, options: Options) {
            super(scene, { ...options, texture: "special_ball" })
            this.blockType = Type.SPECIAL_BALL
        }
    }

    export class ExtraBall extends BaseBlock {
        constructor(scene: MainScene, options: Options) {
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
