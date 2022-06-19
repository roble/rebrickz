import "phaser"

import { PhaserConfig } from "@config"
import { Controller } from "@scenes/Controller"
import { PreloadScene } from "@scenes/PreloadScene"
import { GameOverScene } from "@scenes/GameOverScene"
import { GameScene } from "@scenes/GameScene"

export const game = new Phaser.Game(
	Object.assign(PhaserConfig, {
		scene: [PreloadScene, Controller, GameScene, GameOverScene],
	})
)
