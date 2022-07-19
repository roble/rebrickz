import { GameConfig as config } from "@config"

export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
}
export class GameOverScene extends Phaser.Scene {
	background!: Phaser.GameObjects.Sprite
	buttonRestart!: Phaser.GameObjects.Sprite
	scoreText!: Phaser.GameObjects.Text

	constructor() {
		super({ key: "GameOverScene", active: false })
	}

	create(data: { score: number }) {
		this.background = this.add.sprite(0, 0, "gameover_screen")
		this.background.setAlpha(0).setOrigin(0).setDepth(1)

		this.buttonRestart = this.add.sprite(config.width / 2, config.height - 100, "button_restart")
		this.buttonRestart.setAlpha(0).setOrigin(0.5).setDepth(2).setInteractive()

		this.scoreText = this.add.text(config.width / 2, config.height - 200, `SCORE: ${data.score}`, {
			fontSize: "30px",
			fontFamily: "Arial Black",
		})
		this.scoreText.setDepth(1).setAlpha(0).setOrigin(0.5)

		this.buttonRestart.on("pointerdown", () => {
			this.tweens.add({
				targets: [this.background, this.buttonRestart, this.scoreText],
				duration: 300,
				ease: "Cubic.easeInOut",
				alpha: { from: 1, to: 0 },
				onComplete: () => {
					this.scene.start("GameScene")
				},
			})
		})

		this.tweens.add({
			targets: [this.background, this.buttonRestart, this.scoreText],
			duration: 500,
			ease: "Cubic.easeInOut",
			alpha: { from: 0, to: 1 },
		})
	}
}
