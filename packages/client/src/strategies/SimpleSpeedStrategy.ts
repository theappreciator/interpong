import Player from "../sprites/RectanglePlayer";
import { SpeedStrategy } from "./SpeedStrategy";

const MIN_SPEED = 1;
const MAX_SPEED = 3;
const SPEED_INCREMENT = 0.1;

export default class SimpleSpeedStrategy implements SpeedStrategy {
    increment(player: Player) {
        player.speed = Math.min(player.speed + SPEED_INCREMENT, MAX_SPEED);
    };

    decrement(player: Player) {
        player.speed = Math.max(player.speed - SPEED_INCREMENT, MIN_SPEED);
    };

    setMax(player: Player) {
        player.speed = MAX_SPEED;
    };

    setMin(player: Player) {
        player.speed = MIN_SPEED;
    };
}