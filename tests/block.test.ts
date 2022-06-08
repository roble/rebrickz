import Phaser from "phaser";
import { Block } from "../src/rebrickz/block"
import { MainScene } from "../src/scenes/MainScene"

describe('Phaser', function () {

    it('can create a new instance', function () {
        expect(new Phaser.Game).toBeInstanceOf(Phaser.Game)
    });

    it('is version 3.55.2', function () {
        expect(Phaser).toHaveProperty('VERSION', '3.55.2');
    });
});
