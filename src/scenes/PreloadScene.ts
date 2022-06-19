import Phaser from "phaser"

export class PreloadScene extends Phaser.Scene {
	progressBar!: Phaser.GameObjects.Graphics
	progressBox!: Phaser.GameObjects.Graphics
	barHeight = 20

	constructor() {
		super("PreloadScene")
	}

	preload(): void {
		this.load.baseURL = "assets/"
		// preload the assets
		this.load.image("ground", "ground.png")
		this.load.image("ground_tile", "ground_tile.png")
		this.load.image("ball", "ball.png")
		this.load.image("block", "block.png")
		this.load.image("special_ball", "special_ball.png")
		this.load.image("extra_ball", "extra_ball.png")
		this.load.image("life", "life.png")
		this.load.image("orange_ball", "orange_ball.png")
		this.load.image("collision", "collision.png")
		this.load.image("aim", "aim.png")
		this.load.image("arrow_ball", "arrow_ball.png")

		// game over screen
		this.load.image("button_restart", "button_restart.png")
		this.load.image("gameover_screen", "gameover_screen.png")

		this.load.multiatlas("heart", "heart.json")

		// listeners
		this.load.on("progress", this.handleOnProgress, this)
		this.load.on("complete", this.handleOnComplete, this)

		this.handleOnProgress(1)
	}

	init() {
		this.progressBox = this.add.graphics()
		this.progressBar = this.add.graphics()

		this.progressBox.fillStyle(0x222222, 0.75)
		this.progressBox.fillRect(
			this.cameras.main.width * 0.1,
			this.cameras.main.worldView.y + this.cameras.main.height / 2,
			this.cameras.main.width * 0.8,
			this.barHeight
		)
	}

	handleOnComplete() {
		this.time.addEvent({
			delay: 500,
			callback: () => this.scene.start("Controller"),
		})
	}

	handleOnProgress(value: number) {
		this.progressBar.clear()
		this.progressBar.fillStyle(0xffffff, 1)
		this.progressBar.fillRect(
			this.cameras.main.width * 0.1,
			this.cameras.main.worldView.y + this.cameras.main.height / 2,
			this.cameras.main.width * 0.8 * value,
			this.barHeight
		)
	}
}
