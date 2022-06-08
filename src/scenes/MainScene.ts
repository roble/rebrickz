import * as Rebrickz from "@rebrickz";

import { GameConfig, GameConfigType } from "@config";
import { Ball, BallType } from "@objects/Ball";
import { Balls } from "@objects/Balls";
import { Block, BlockType } from "@objects/Block";
import { BlocksManager } from "@objects/BlocksManager";

export enum GameState {
  WAITING_PLAYER,
  AIMING,
  RUNNING,
  UPDATING
}

export class MainScene extends Phaser.Scene {
  public config: GameConfigType;

  public world!: Rebrickz.World;

  private balls!: Balls;
  private blocks!: BlocksManager;
  private state: GameState;
  private direction!: number;
  private trajectoryGraphics!: {
    x1: Phaser.GameObjects.Graphics;
    x2: Phaser.GameObjects.Graphics;
    y1: Phaser.GameObjects.Graphics;
    y2: Phaser.GameObjects.Graphics;
    center: Phaser.GameObjects.Graphics;
  };

  private collision!: Phaser.GameObjects.Image;
  private firstBallToLand!: Ball | undefined;
  trajectoryRectangle!: Phaser.GameObjects.Rectangle;
  gameOver: boolean;

  constructor() {
    super({ key: "MainScene" });

    this.config = GameConfig;
    this.state = GameState.WAITING_PLAYER;
    this.gameOver = false;
  }

  init() {

    this.world = new Rebrickz.World(this, this.handleWorldCollision);
    this.addEventListeners();

    // init groups
    this.balls = new Balls(this);
    this.blocks = new BlocksManager(this);

    const x = this.world.getBounds().centerX;
    const y = this.world.getBoundsBottom() - this.config.ball.size / 2;

    // Add first ball
    this.addBall(x, y);

    // Add block
    // this.addBlocks();

    // create the trajectory element
    this.trajectoryGraphics = {
      x1: this.add.graphics(),
      y1: this.add.graphics(),
      x2: this.add.graphics(),
      y2: this.add.graphics(),
      center: this.add.graphics()
    };

    this.trajectoryRectangle = this.add.rectangle(0, 50, this.config.ball.size, 1000);
    this.trajectoryRectangle.setOrigin(0.5, 1);
    this.trajectoryRectangle.visible = false;

    // create element to show collision
    this.collision = this.add.sprite(-50, -50, "collision");

    this.tweens.add({
      targets: this.collision,
      props: {
        angle: { value: "+=360" }
      },
      duration: 3000,
      repeat: -1,
      ease: "Linear"
    });
  }

  create() {
    const b = new Rebrickz.Block.Normal(this, { row: 3, col: 6 });

    this.add.existing(b);

    console.log(b);

    this.handleBallCollision();
  }

  update() {
    // if Arcade physics is updating or balls are running and all balls have landed...
    if (this.state === GameState.RUNNING) {

    }

    if (this.state === GameState.UPDATING) {
      // // move the blocks
      this.moveBlockRow();
      this.addBlocks();
      // this.collectBalls()
    }

    if (this.gameOver) {
      // this.restartGame()
    }
  }

  addEventListeners() {
    /**
     *  Input listeners
     */
    this.input.on("pointerup", this.fireBalls, this);
    this.input.on("pointerdown", this.startAim, this);
    this.input.on("pointermove", this.adjustAim, this);
  }

  clearTrajectoryLines() {
    this.trajectoryGraphics.x1.clear();
    this.trajectoryGraphics.y1.clear();
    this.trajectoryGraphics.x2.clear();
    this.trajectoryGraphics.y2.clear();
    this.trajectoryGraphics.center.clear();

    this.trajectoryRectangle.visible = false;
    this.collision.visible = false;
  }

  fireBalls(event: PointerEvent) {
    this.clearTrajectoryLines();

    this.firstBallToLand = undefined;

    if (this.state !== GameState.AIMING || !this.direction) return;

    this.state = GameState.RUNNING;

    this.balls.fire(this.direction);
  }

  canAdjustAim(event: any): boolean {
    return this.input.activePointer.leftButtonDown() && event.y < this.world.getBoundsBottom();
  }

  getBottomLeftLine(): Phaser.Geom.Line {
    return new Phaser.Geom.Line(
      this.world.getBounds().x + this.world.getBounds().width,
      this.world.getBounds().y + this.world.getBounds().height,
      this.world.getBounds().x + this.world.getBounds().width,
      this.world.getBoundsBottom()
    );
  }

  getBottomRightLine(): Phaser.Geom.Line {
    return new Phaser.Geom.Line(
      this.world.getBounds().x,
      this.world.getBounds().y + this.world.getBounds().height,
      this.world.getBounds().x,
      this.world.getBoundsBottom()
    );
  }

  getWorldIntersection(line: Phaser.Geom.Line): Phaser.Geom.Point | boolean {
    const intersect = {
      top: Phaser.Geom.Intersects.GetLineToLine(line, this.world.getBounds().getLineA()),
      right: Phaser.Geom.Intersects.GetLineToLine(line, this.world.getBounds().getLineB()),
      left: Phaser.Geom.Intersects.GetLineToLine(line, this.world.getBounds().getLineD())
    };

    if (intersect.top) return new Phaser.Geom.Point(intersect.top.x, this.world.getBounds().top);

    if (intersect.left) return new Phaser.Geom.Point(this.world.getBounds().left, intersect.left.y);

    if (intersect.right) return new Phaser.Geom.Point(this.world.getBounds().right, intersect.right.y);

    const collideRight = Phaser.Geom.Intersects.LineToLine(line, this.getBottomRightLine());

    if (collideRight)
      return new Phaser.Geom.Point(
        this.world.getBounds().x,
        this.world.getBounds().y + this.world.getBounds().height
      );

    const collideLeft = Phaser.Geom.Intersects.LineToLine(line, this.getBottomLeftLine());

    if (collideLeft)
      return new Phaser.Geom.Point(
        this.world.getBounds().x + this.world.getBounds().width,
        this.world.getBounds().y + this.world.getBounds().height
      );

    return false;
  }

  adjustAim(event: any) {
    if (this.state === GameState.AIMING) {
      // clear trajectory graphics
      this.clearTrajectoryLines();

      if (!this.canAdjustAim(event)) {
        this.state = GameState.WAITING_PLAYER;
        this.collision.visible = false;
        return;
      }

      const distX = event.x;
      const distY = event.y;
      const firstBall = this.firstBallToLand || this.balls.getFirstBall();
      const angle = Phaser.Math.Angle.Between(firstBall.x, firstBall.y, distX, distY);

      this.direction = Phaser.Math.Angle.Wrap(angle);

      const line: Phaser.Geom.Line = new Phaser.Geom.Line(
        distX + 1000 * Math.cos(angle),
        distY + 1000 * Math.sin(angle),
        firstBall.x,
        firstBall.y
      );

      const blocksBounds = this.blocks.groups[BlockType.NORMAL].getBlocksBounds();

      let collisionWorld, collisionBlock: Phaser.Geom.Point;

      collisionWorld = this.getWorldIntersection(line) as Phaser.Geom.Point;

      if (!collisionWorld) {
        this.state = GameState.WAITING_PLAYER;
        this.clearTrajectoryLines();
        this.collision.visible = false;
        return;
      }

      this.trajectoryRectangle.visible = true;
      this.trajectoryRectangle.setFillStyle(0xffffff, 0.1);
      this.trajectoryRectangle.x = line.x2;
      this.trajectoryRectangle.y = line.y2;
      this.trajectoryRectangle.setAngle(Phaser.Math.RadToDeg(this.direction) + 90);

      // get intersections
      let collideBlocks = blocksBounds.map((rect) =>
        Phaser.Geom.Intersects.GetLineToRectangle(line, rect)
      );

      // filter empty
      collideBlocks = collideBlocks.filter((e) => e.length);

      let closestBlock;
      for (const arr of collideBlocks) {
        if (!closestBlock) closestBlock = arr;
        // bottom
        if (arr[1] && closestBlock[1] && arr[1].y > closestBlock[1].y) closestBlock = arr;
      }

      // has collision, get from the world bounds

      line.x1 = collisionWorld.x;
      line.y1 = collisionWorld.y;
      this.trajectoryRectangle.displayHeight = line.y2;

      if (closestBlock) {
        collisionBlock = closestBlock[0].y > closestBlock[1].y ? closestBlock[0] : closestBlock[1];
        this.collision.x = collisionBlock.x;
        this.collision.y = collisionBlock.y;
      } else {
        this.collision.x = collisionWorld.x;
        this.collision.y = collisionWorld.y;
      }

      this.collision.visible = true;

      this.direction = Phaser.Math.Angle.Wrap(
        Phaser.Math.Angle.Between(firstBall.x, firstBall.y, line.x1, line.y1)
      );

      // set trajectory graphics line style
      this.drawTrajectoryLines(line, distX, distY);
    }
  }

  drawTrajectoryLines(line: Phaser.Geom.Line, distX: number, distY: number) {
    // const size = this.config.ball.size
    // const radius = size / 2
    // const firstBall = this.firstBallToLand || this.balls.getFirstBall()
    // const angle = Phaser.Math.Angle.Between(firstBall.x, firstBall.y, distX, distY)

    // this.direction = Phaser.Math.Angle.Wrap(angle)

    // this.trajectoryGraphics.x1.lineStyle(1, 0x00ff00).fillStyle(0xff0000).lineBetween(
    //   (distX) + 1000 * Math.cos(angle),
    //   (distY) + 1000 * Math.sin(angle),
    //   firstBall.x - radius,
    //   firstBall.y - radius
    // )

    // this.trajectoryGraphics.y1.lineStyle(1, 0x00ff00).fillStyle(0xff0000).lineBetween(line.x1 + radius, line.y1, line.x2 + radius, line.y2 - radius)
    // this.trajectoryGraphics.x2.lineStyle(1, 0x00ff00).fillStyle(0xff0000).lineBetween(line.x1 + radius, line.y1 - radius, line.x2 + radius, line.y2 + radius)
    // this.trajectoryGraphics.y2.lineStyle(1, 0x00ff00).fillStyle(0xff0000).lineBetween(line.x1 - radius, line.y1, line.x2 - radius, line.y2)
    this.trajectoryGraphics.center
      .lineStyle(1, 0x00ff00)
      .fillStyle(0xff0000)
      .lineBetween(line.x1, line.y1, line.x2, line.y2);
  }

  getFirstBallPosition(): { x: number; y: number } {
    const ball = this.balls.getChildren()[0] as Ball;
    return {
      x: ball.x,
      y: ball.y
    };
  }
  startAim(event: PointerEvent) {
    if (this.state === GameState.WAITING_PLAYER) {
      this.state = GameState.AIMING;
    }
  }

  /**
   * Add block
   */
  addBlock(row: number, col: number, type: BlockType) {
    const block = new Block(this, { row, col, type, level: 1 });

    block.on("destroy", this.handleOnBlockDestroy, this);

    this.blocks.groups[type].add(block, true);

    return block;
  }

  addBlocks() {
    const maxDropPerRound = 4;
    const { cols } = this.config;

    const rows = 2;

    const blocks = Phaser.Math.Between(1, maxDropPerRound);
    const dropSpecialBall = Phaser.Math.Between(0, 100) < 30;
    const dropExtraBall = Phaser.Math.Between(0, 100) < 30;

    const add = (type: BlockType) => {
      const row = Phaser.Math.Between(1, rows - 1);
      const col = Phaser.Math.Between(0, cols - 1);

      if (this.blocks.isSlotEmpty(row, col)) {
        this.addBlock(row, col, type);
      }
    };

    // if (dropSpecialBall)
    //   add(BlockType.SPECIAL_BALL)

    // if (dropExtraBall)
    //   add(BlockType.EXTRA_BALL)

    for (let i = 0; i < blocks; i++) {
      add(BlockType.NORMAL);
    }

    this.blocks.getFreeSlots();
  }

  moveBlockRow() {
    this.state = GameState.UPDATING;
    // we will move blocks with a tween
    const blocks = this.blocks.getChildren() as Block[];
    // const balls = this.extraBallGroup.getChildren() as Block[]
    // const extraBalls = this.extraBallGroup.getChildren() as Block[]
    const children = [...blocks] as Block[];

    for (const block of children) {
      const oldRow = block.row;
      const { row } = block.moveDown();

      if (row === oldRow && row >= block.lastRowIndex && block.blockType === BlockType.NORMAL) {
        this.gameOver = true;
        break;
      }
    }

    if (!this.gameOver) {
      // this.level++
      // this.levelText.text = `LEVEL: ${this.level}`
    }
    // wait the animation

    this.state = GameState.WAITING_PLAYER;
  }

  addBall(x: number, y: number, type: BallType = BallType.NORMAL): Ball | boolean {
    if (!this.balls.getTotalFree()) return false;

    const size = this.config.ball.size;
    const ball = new Ball(this);

    ball.x = x;
    ball.y = y;

    this.balls.add(ball, true);

    // ball.setCircle(ball.width / 2)
    ball.enableCollision(true);
    ball.setOrigin(0.5);

    return ball;
  }

  handleWorldCollision(
    _ball: Phaser.Physics.Arcade.Body,
    up: boolean,
    down: boolean,
    _left?: boolean,
    _right?: boolean
  ) {
    if (!down) return;

    const ball = _ball.gameObject as Ball;
    ball.stop();

    if (!this.firstBallToLand) {
      this.firstBallToLand = ball;
    } else {
      const { x, y } = this.firstBallToLand;
      ball.move(x, y);
    }

    if (!this.balls.isRunning()) {
      // Wait ball animations before allow next move
      this.time.addEvent({
        delay: 300,
        callback: () => {
          this.state = GameState.UPDATING;
        }
      });
    }
  }

  handleBallCollision() {
    this.physics.add.collider(this.balls, this.blocks.groups[BlockType.NORMAL], (ball, _block) => {
      const block = _block as Block;
      const health = block.damage(1);
      const maxHealth = block.maxHealth;

      // this.increaseCombo()

      // if (health <= 0) {
      //   this.increaseScore(maxHealth)
      // }
    });
  }

  /**
   * On block destroy
   */

  handleOnBlockDestroy(block: Block) {
    // const type = block.blockType
    // switch (type) {
    //   case BlockType.SPECIAL_BALL:
    //   case BlockType.EXTRA_BALL: {
    //     const ball = new Ball(this, block.x, block.y, 'ball')
    //     this.ballsCollectedGroup.add(ball, true)
    //     const y = 12 + this.config.world.getBounds().padding_top + this.config.world.getBounds().height + this.config.world.getBounds().padding_x
    //     const x = this.firstBallToLand.x
    //     ball.move(undefined, y)
    //     this.time.addEvent({
    //       delay: 400,
    //       callbackScope: this,
    //       args: [{
    //         alpha: 1,
    //         scale: 1,
    //         ease: 'Quart.easeOut',
    //         duration: 200,
    //         x: x,
    //       }]
    //     })
    //     break;
    //   }
    //   default: {
    //     this.blocksDestroyed++
    //     // this.blocksDestroyedText.text = `BLOCKS DESTROYED: ${this.blocksDestroyed.toString()}`
    //   }
    // }
  }
}
