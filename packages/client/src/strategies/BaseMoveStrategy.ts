import * as PIXI from 'pixi.js';
import { MoveStrategy } from "./MoveStrategy";
import Player from "../sprites/RectanglePlayer";
import { Vector } from "@interpong/common";



abstract class BaseMoveStrategy implements MoveStrategy {
    
    moveLeft(player: Player) {
        player.v.x = -player.speed;
        return true;
    }

    stopLeft(player: Player) {
        player.v.x = 0;
        return true;
    }

    moveUp(player: Player) {
        player.v.y = -player.speed;
        return true;
    }

    stopUp(player: Player) {
        player.v.y = 0;
        return true;
    }

    moveRight(player: Player) {
        player.v.x = player.speed;
        return true;
    }

    stopRight(player: Player) {
        player.v.x = 0;
        return true;
    }

    moveDown(player: Player) {
        player.v.y = player.speed;
        return true;
    }

    stopDown(player: Player) {
        player.v.y = 0;
        return true;
    }

    stopMoving(player: Player) {
        player.v.x = 0;
        player.v.y = 0;
        return true;
    }
}

export default BaseMoveStrategy;