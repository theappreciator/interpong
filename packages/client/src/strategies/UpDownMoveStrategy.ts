import Player, { RectanglePlayerShapePointed } from "../sprites/RectanglePlayer";
import { MoveStrategy } from "./MoveStrategy";
import BaseMoveStrategy from "./BaseMoveStrategy";
import { Vector } from "@interpong/common";



export default class UpDownMoveStrategy extends BaseMoveStrategy implements MoveStrategy {
    moveLeft(player: Player) {
        // player.v.x = -player.speed; 
    }

    stopLeft(player: Player) {
        // player.v.x = 0;
    }

    moveUp(player: Player) {
        player.v.y = -player.speed;
    }

    stopUp(player: Player) {
        player.v.y = 0;
    }

    moveRight(player: Player) {
        // player.v.x = player.speed;
    }

    stopRight(player: Player) {
        // player.v.x = 0;
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

    protected onPointerDown(downPosition: Vector, player: Player) {
        this._isTouched = true;
        player.updateShape(RectanglePlayerShapePointed);

        if (downPosition.y === player.center.y) {
            player.stopMoving();
        }
        else {
            const isPointerAbove = downPosition.y < player.center.y;
            if (isPointerAbove) {
                player.moveUp();
            }
            else {
                player.moveDown();
            }
        }
    }

    protected onPointerUp(upPosition: Vector, player: Player) {
        if (this._isTouched) {
            this._isTouched = false;
            player.updateShape();
            player.stopMoving();
        };
    }

    protected onPointerMove(position: Vector, player: Player): void {
        if (this._isTouched) {
            if (position.y === player.center.y) {
                player.stopMoving();
            }
            else {
                const isPointerAbove = position.y < player.center.y;
                if (isPointerAbove) {
                    player.moveUp();
                }
                else {
                    player.moveDown();
                }
            }
        }
    }
}