import { GameConfig as config } from "@config"
import * as Rebrickz from "@rebrickz"

export type RowColPosition = {
	row: number
	col: number
}

export class Position {
	static getYByRow(row: number): number {
		return Rebrickz.World.origin.y + config.marginTop + row * config.brick.size + config.brick.size * 0.5
	}

	static getXByCol(col: number): number {
		return Rebrickz.World.origin.x + col * config.brick.size + config.brick.size * 0.5
	}

	static getPositionByRowCol(row: number, col: number): Phaser.Geom.Point {
		return new Phaser.Geom.Point(Position.getYByRow(row), Position.getXByCol(col))
	}
}
