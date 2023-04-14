import * as PIXI from 'pixi.js';
import { MoveStrategy } from "./MoveStrategy";
import Player from "../sprites/RectanglePlayer";
import { Vector } from "@interpong/common";



abstract class BaseMoveStrategy implements MoveStrategy {

    protected _isTouched = false;
    
    moveLeft(player: Player) {
        player.v.x = -player.speed; 
    }

    stopLeft(player: Player) {
        player.v.x = 0;
    }

    moveUp(player: Player) {
        player.v.y = -player.speed;
    }

    stopUp(player: Player) {
        player.v.y = 0;
    }

    moveRight(player: Player) {
        player.v.x = player.speed;
    }

    stopRight(player: Player) {
        player.v.x = 0;
    }

    moveDown(player: Player) {
        player.v.y = player.speed;
    }

    stopDown(player: Player) {
        player.v.y = 0;
    }

    stopMoving(player: Player) {
        player.v.x = 0;
        player.v.y = 0;
    }

    abstract onPointerDown(downPosition: Vector, player: Player): void;
    abstract onPointerUp(upPosition: Vector, player: Player): void;
    abstract onPointerMove(position: Vector, player: Player): void;
}

export default BaseMoveStrategy;