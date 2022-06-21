export class Score {
	private scene: Phaser.Scene
	private value: number
	private text: Phaser.GameObjects.Text

	constructor(scene: Phaser.Scene, x: number, y: number, initialValue = 0) {
		this.scene = scene
		this.value = initialValue
		this.text = this.scene.add.text(x, y, this.toString())
	}

	update() {
		this.text.text = this.toString()
	}

	toString() {
		return `SCORE: ${this.value}`
	}

	getValue() {
		return this.value
	}

	setValue(value: number) {
		this.value = Math.ceil(value)
	}

	increase(value: number) {
		this.value += Math.ceil(value)
		this.update()
	}
}
