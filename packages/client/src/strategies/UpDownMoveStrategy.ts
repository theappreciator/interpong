import Player from "../sprites/RectanglePlayer";
import { MoveStrategy } from "./MoveStrategy";
import BaseMoveStrategy from "./BaseMoveStrategy";



export default class UpDownMoveStrategy extends BaseMoveStrategy implements MoveStrategy {
    moveLeft(player: Player) {
        return false;
    }

    stopLeft(player: Player) {
        return false;
    }

    moveRight(player: Player) {
        return false;
    }

    stopRight(player: Player) {
        return false;
    }
}