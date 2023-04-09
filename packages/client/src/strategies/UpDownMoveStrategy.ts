import Player, { RectanglePlayerShapePointed } from "../sprites/RectanglePlayer";
import { MoveStrategy } from "./MoveStrategy";
import * as PIXI from 'pixi.js';
import { DEFAULTS } from "../constants";



export default class UpDownMoveStrategy implements MoveStrategy {
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

    setPointerEvents(player: Player) {
        const shape = player.getSpriteObj()
        shape.interactive = true;

        let touched = false;
        shape.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
            touched = true;
            player.updateShape(RectanglePlayerShapePointed);

            if (event.global.y === player.center.y) {
                player.stopDown();
                player.stopUp();
            }
            else {
                const isPointerAbove = event.global.y < player.center.y;
                if (isPointerAbove) {
                    player.moveUp();
                }
                else {
                    player.moveDown();
                }
            }
            
        });
        shape.on("pointerup", () => {
            if (touched) {
                touched = false;
                player.updateShape();

                player.stopUp();
                player.stopDown();
            };
        });
        shape.on("pointerupoutside", () => {
            if (touched) {
                touched = false;
                player.updateShape();

                player.stopUp();
                player.stopDown();
            }
        });
        shape.on("globalpointermove", (event: PIXI.FederatedPointerEvent) => {
            if (touched) {
                if (event.global.y === player.center.y) {
                    player.stopDown();
                    player.stopUp();
                }
                else {
                    const isPointerAbove = event.global.y < player.center.y;
                    if (isPointerAbove) {
                        player.moveUp();
                    }
                    else {
                        player.moveDown();
                    }
                }
            }
        });
    }
}