import "phaser";

import { PhaserConfig } from "@config";
import { MainScene } from "@scenes/MainScene";
import { PreloadScene } from "@scenes/PreloadScene";

window.addEventListener("load", () => {
  new Phaser.Game(
    Object.assign(PhaserConfig, {
      scene: [PreloadScene, MainScene]
    })
  );
});
