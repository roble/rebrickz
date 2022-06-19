export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
}
export class Controller extends Phaser.Scene {
	currentScene!: Phaser.Scene

	constructor() {
		super({ key: "Controller" })
	}

	create() {
		// this.rebrickz = new Rebrickz(this)
		// this.rebrickz.on("gameover", () => {
		// 	console.warn("GAME OVER")
		// })

		this.scene.launch("GameScene")
		this.scene.setActive(true, "GameScene")
		this.scene.setVisible(true, "GameScene")

		this.currentScene = this.scene.get("GameScene")
	}

	update() {
		// this.rebrickz.update()
		// return
	}
}
