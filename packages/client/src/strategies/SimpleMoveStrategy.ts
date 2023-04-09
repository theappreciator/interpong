import Player from "../sprites/RectanglePlayer";
import { MoveStrategy } from "./MoveStrategy";
import * as PIXI from 'pixi.js';



export default class SimpleMoveStrategy implements MoveStrategy {
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
    
    setPointerEvents(player: Player) {
        let touched = false;
        const shape = player.getSpriteObj()
        shape.interactive = true;
        shape.on("pointerdown", () => touched = true);
        shape.on("pointerup", () => touched = false);
        shape.on("pointermove", (event: PIXI.FederatedPointerEvent) => console.log("moved", touched, event));
        shape.on("globalmousemove", (event: PIXI.FederatedPointerEvent) => console.log("global moved", touched, event));
    }
}