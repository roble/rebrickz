import { Game as Rebrickz } from "@rebrickz/game"

export enum GameState {
	WAITING_PLAYER,
	RUNNING,
	UPDATING,
}
export class MainScene extends Phaser.Scene {
	rebrickz!: Rebrickz

	constructor() {
		super({ key: "MainScene" })
	}

	create() {
		this.rebrickz = new Rebrickz(this)
		this.rebrickz.on("gameover", () => {
			console.warn("GAME OVER")
		})
	}

	update() {
		this.rebrickz.update()
		return
	}
}
