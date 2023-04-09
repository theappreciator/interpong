import Player from "../sprites/RectanglePlayer";
import { MoveStrategy } from "./MoveStrategy";


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
}