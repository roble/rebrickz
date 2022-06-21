import { GameConfig as config } from "@config"
import { Brick } from ".."

export class Health extends Phaser.Events.EventEmitter {
	static readonly EVENTS = {
		DIED: "died",
		DAMAGE: "damage",
	}

	static readonly DAMAGE_TYPE = {
		NORMAL: "normal",
		CRITICAL: "critical",
		INSTANT_KILL: "instant_kill",
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
	offsetY = -config.brick.size + 8
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
			this.emit(Health.EVENTS.DAMAGE, this.health)
		} else {
			this.health = 0
			this.emit(Health.EVENTS.DIED)
		}

		if (draw) this.draw()
	}

	damage(type = Health.DAMAGE_TYPE.NORMAL): this {
		switch (type) {
			case Health.DAMAGE_TYPE.NORMAL: {
				this.decrease()
				break
			}
			case Health.DAMAGE_TYPE.CRITICAL: {
				this.decrease(Math.max(this.health * config.ball.criticalHealthPercentage, 1))
				this.animateText(this.criticalText)
				break
			}
			case Health.DAMAGE_TYPE.INSTANT_KILL: {
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
