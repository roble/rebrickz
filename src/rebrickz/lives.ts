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
	scene: Phaser.Scene
	x = 50
	y = 50
	lifeWidth = 20
	lives: Life[] = []
	max: number
	current: number

	constructor(scene: Phaser.Scene, max = 3) {
		this.scene = scene
		this.max = max
		this.current = max

		for (let i = 0; i < max; i++) {
			this.lives.push(new Life(scene, this.x + this.lifeWidth * i, this.y))
		}
	}

	update() {
		this.lives.forEach((life) => {
			life.setState(false)
		})
		for (let i = 0; i < this.current; i++) {
			this.lives[i].setState(true)
		}
		console.log(this.current)
	}

	decrease() {
		if (this.current > 0) this.current--

		this.update()
		return this.current > 0
	}

	increase() {
		this.current++
		this.current = Math.min(this.current, this.max)

		this.update()
		return this.current
	}

	restart() {
		this.current = this.max
		for (let i = 0; i < this.current; i++) {
			this.lives[i].setState(true)
		}
	}
}
