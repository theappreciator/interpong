import { Vector } from "@interpong/common";
import PlayerType from "../sprites/RectanglePlayer";

export interface MoveStrategy {
    onPointerDown: (position: Vector, player: PlayerType) => void;
    onPointerUp: (position: Vector, player: PlayerType) => void;
    onPointerMove: (position: Vector, player: PlayerType) => void;
    moveLeft: (player: PlayerType) => void;
    stopLeft: (player: PlayerType) => void;
    moveUp: (player: PlayerType) => void;
    stopUp: (player: PlayerType) => void;
    moveRight: (player: PlayerType) => void;
    stopRight: (player: PlayerType) => void;
    moveDown: (player: PlayerType) => void;
    stopDown: (player: PlayerType) => void;
    stopMoving: (player: PlayerType) => void;
}