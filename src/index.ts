import "phaser"

import { PhaserConfig } from "@config"
import { MainScene } from "@scenes/MainScene"
import { PreloadScene } from "@scenes/PreloadScene"

export const game = new Phaser.Game(
	Object.assign(PhaserConfig, {
		scene: [PreloadScene, MainScene],
	})
)
