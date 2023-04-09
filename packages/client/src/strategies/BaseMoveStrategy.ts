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

    protected abstract onPointerDown(downPosition: Vector, player: Player): void;
    protected abstract onPointerUp(upPosition: Vector, player: Player): void;
    protected abstract onPointerMove(position: Vector, player: Player): void;

    setPointerEvents(player: Player) {
        const shape = player.getSpriteObj()
        shape.interactive = true;

        let touched = false;
        shape.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
            const downPosition = {
                x: event.global.x,
                y: event.global.y
            }
            this.onPointerDown(downPosition, player); 
        });
        shape.on("pointerup", (event: PIXI.FederatedPointerEvent) => {
            const upPosition = {
                x: event.global.x,
                y: event.global.y
            }
            this.onPointerUp(upPosition, player); 
        });
        shape.on("pointerupoutside", (event: PIXI.FederatedPointerEvent) => {
            const upPosition = {
                x: event.global.x,
                y: event.global.y
            }
            this.onPointerUp(upPosition, player); 
        });
        shape.on("globalpointermove", (event: PIXI.FederatedPointerEvent) => {
            const position = {
                x: event.global.x,
                y: event.global.y
            }
            this.onPointerMove(position, player); 
        });
    }
}

export default BaseMoveStrategy;