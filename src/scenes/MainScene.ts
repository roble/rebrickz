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
		console.log(this.rebrickz)
	}

	update() {
		this.rebrickz.update()
		return
	}
}
