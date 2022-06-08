import { GameConfigType } from "@config";
import { MainScene } from "@scenes/MainScene";
import { Block, BlockType } from "./Block";
import { Blocks } from "./Blocks";

export type BlockGroup = {
  [key in BlockType]: Blocks;
};

export class BlocksManager {
  private scene: MainScene;
  public groups: BlockGroup;
  public config: GameConfigType;

  constructor(scene: MainScene) {
    this.scene = scene;
    this.groups = {
      [BlockType.NORMAL]: new Blocks(scene),
      [BlockType.SPECIAL_BALL]: new Blocks(scene),
      [BlockType.EXTRA_BALL]: new Blocks(scene)
    };
    this.config = scene.config;
  }

  get lastRowIndex(): number {
    return this.config.rows - 1;
  }

  get lastColIndex(): number {
    return this.config.cols - 1;
  }

  getSlots(): boolean[][] {
    const { rows, cols } = this.config;

    const slots: boolean[][] = [];

    for (let row = 0; row < rows; row++) {
      slots[row] = [];
      for (let col = 0; col < cols; col++) {
        slots[row][col] = false;
      }
    }

    return slots;
  }

  populateSlotByType(type: BlockType, slots: boolean[][]) {
    this.groups[type]?.blocks.forEach((block) => {
      slots[block.row][block.col] = true;
    });
  }

  isSlotEmpty(row: number, col: number) {
    return !this.getFreeSlots()[row][col];
  }

  getBlockTypes(): number[] {
    return Object.values(BlockType)
      .filter((e) => !isNaN(Number(e)))
      .map((e) => Number(e));
  }

  getFreeSlots(rowStart: number = 0, rowEnd: number = -1): boolean[][] {
    const { rows } = this.config;

    if (rowStart < 0) rowStart = 0;
    if (rowEnd < 0) rowEnd = this.lastRowIndex;

    rowStart = Math.min(rowStart, this.lastRowIndex);
    rowEnd = Math.min(rowEnd, this.lastRowIndex);

    const slots = this.getSlots();

    for (const type of this.getBlockTypes()) {
      this.populateSlotByType(type, slots);
    }

    return slots.slice(rowStart, rowEnd);
  }

  getChildrenByType(type: BlockType) {
    return this.groups[type].blocks as Block[];
  }

  getChildren() {
    let children: Block[] = [];
    for (const type of this.getBlockTypes()) {
      children = [...children, ...this.getChildrenByType(type)];
    }
    return children;
  }
}
