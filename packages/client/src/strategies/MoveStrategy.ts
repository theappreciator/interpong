import Player from "../sprites/RectanglePlayer";

export interface MoveStrategy {
    moveLeft: (player: Player) => void;
    stopLeft: (player: Player) => void;
    moveUp: (player: Player) => void;
    stopUp: (player: Player) => void;
    moveRight: (player: Player) => void;
    stopRight: (player: Player) => void;
    moveDown: (player: Player) => void;
    stopDown: (player: Player) => void;
    setPointerEvents: (player: Player) => void;
}