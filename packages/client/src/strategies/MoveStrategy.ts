import { Vector } from "@interpong/common";
import PlayerType from "../sprites/RectanglePlayer";

export interface MoveStrategy {
    moveLeft: (player: PlayerType) => boolean;
    stopLeft: (player: PlayerType) => boolean;
    moveUp: (player: PlayerType) => boolean;
    stopUp: (player: PlayerType) => boolean;
    moveRight: (player: PlayerType) => boolean;
    stopRight: (player: PlayerType) => boolean;
    moveDown: (player: PlayerType) => boolean;
    stopDown: (player: PlayerType) => boolean;
    stopMoving: (player: PlayerType) => boolean;
}