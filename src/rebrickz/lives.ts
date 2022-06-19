import { GameConfig as config } from "@config"

class Life {
	scene: Phaser.Scene
	x: number
	y: number
	state: boolean
	sprite: Phaser.GameObjects.Sprite

	constructor(scene: Phaser.Scene, x: number, y: number, state = true) {
		this.scene = scene
		this.x = x
		this.y = y
		this.state = state
		this.sprite = this.scene.add.sprite(this.x, this.y, "heart")
	}

	setState(state: boolean) {
		this.state = state
		if (state) this.sprite.setFrame("heart_filled.png")
		else this.sprite.setFrame("heart_outlined.png")
	}
}

export class Lives {
	static readonly EVENTS = {
		INCREASE: "increase",
		DECREASE: "decrease",
	}

	scene: Phaser.Scene
	x = 50
	y = 50
	lifeWidth = 20
	lives: Life[] = []
	max: number
	current: number
	events: Phaser.Events.EventEmitter

	constructor(scene: Phaser.Scene, max = config.lives) {
		this.scene = scene
		this.max = max
		this.current = max
		this.events = new Phaser.Events.EventEmitter()

		for (let i = 0; i < max; i++) {
			this.lives.push(new Life(scene, this.x + this.lifeWidth * i, this.y))
		}

		this.update()
	}

	update() {
		this.lives.forEach((life, index) => {
			if (index < this.current) life.setState(true)
			else life.setState(false)
		})
	}

	decrease() {
		const tmp = this.current

		if (this.current > 0) this.current--
		if (tmp !== this.current) {
			this.events.emit(Lives.EVENTS.DECREASE)
			this.flashScene()
		}

		this.update()

		return this.current > 0
	}

	increase(update: boolean) {
		const tmp = this.current

		this.current++
		this.current = Math.min(this.current, this.max)

		if (tmp !== this.current) this.events.emit(Lives.EVENTS.INCREASE)

		if (update) this.update()

		return this.current
	}

	restart() {
		this.current = this.max

		for (let i = 0; i < this.current; i++) {
			this.lives[i].setState(true)
		}
	}

	getFirstEmpty() {
		return this.lives.find((life) => !life.state)
	}

	animateIncrease(x: number, y: number) {
		console.log(x, y)
		const tmp = this.current
		this.increase(false)

		if (tmp !== this.current) {
			const heart = this.scene.add.sprite(x, y, "heart")
			const toLife = this.getFirstEmpty()

			heart.setDepth(10)
			heart.setAlpha(0)

			this.scene.tweens.timeline({
				targets: heart,
				ease: "Cubic.easeInOut",
				tweens: [
					{
						y: "+=50",
						scale: 2,
						alpha: 1,
						duration: 700,
						// rotation: 2,
						angle: 360,
					},
					{
						x: toLife?.x || this.x,
						y: toLife?.y || this.y,
						scale: 1,
						duration: 350,
					},
				],
				onComplete: () => {
					heart.destroy(true)
					this.update()
				},
			})
		}
	}

	private flashScene() {
		const rect = this.scene.add.rectangle(0, 0, config.width, config.height, 0xff0000)

		rect.setBlendMode(Phaser.BlendModes.ADD)
		rect.setOrigin(0)
		rect.setDepth(1)
		rect.setAlpha(0)

		this.scene.tweens.add({
			targets: rect,
			duration: 150,
			ease: "Linear",
			alpha: { from: 0, to: 1 },
			yoyo: 1,
			onComplete: () => {
				rect.destroy(true)
			},
		})
	}
}
