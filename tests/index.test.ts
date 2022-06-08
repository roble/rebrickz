import Phaser from "phaser"

const config = {
    type: Phaser.HEADLESS
}

describe('Phaser', () => {

    it('can create a new instance', () => {
        expect(new Phaser.Game(config)).toBeInstanceOf(Phaser.Game)
    })

    it('is version 3.55.2', () => {
        expect(Phaser).toHaveProperty('VERSION', '3.55.2');
    })
});
