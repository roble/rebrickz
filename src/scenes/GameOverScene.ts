import { GameConfig as config } from "@config"

export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
}
export class GameOverScene extends Phaser.Scene {
	background!: Phaser.GameObjects.Sprite
	buttonRestart!: Phaser.GameObjects.Sprite

	constructor() {
		super({ key: "GameOverScene", active: false })
	}

	create(data: { score: number }) {
		this.background = this.add.sprite(0, 0, "gameover_screen")
		this.background.setAlpha(0).setOrigin(0).setDepth(1)

		this.buttonRestart = this.add.sprite(config.width / 2, config.height - 100, "button_restart")
		this.buttonRestart.setAlpha(0).setOrigin(0.5).setDepth(2).setInteractive()

		this.buttonRestart.on("pointerdown", () => {
			console.log("RESTART")
			this.tweens.add({
				targets: [this.background, this.buttonRestart],
				duration: 300,
				ease: "Cubic.easeInOut",
				alpha: { from: 1, to: 0 },
				onComplete: () => {
					console.log("GO TO MAIN SCENE")
					this.scene.start("GameScene")
				},
			})
		})

		this.tweens.add({
			targets: [this.background, this.buttonRestart],
			duration: 500,
			ease: "Cubic.easeInOut",
			alpha: { from: 0, to: 1 },
		})

		const text = this.add.text(config.width / 2, config.height - 200, `SCORE: ${data.score}`, {
			fontSize: "30px",
			fontFamily: "Arial Black",
		})
		text.setDepth(1)
		text.setOrigin(0.5)
	}
}
