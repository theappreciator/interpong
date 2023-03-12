import Player from "~/sprites/Player";

export interface SpeedStrategy {
    increment: (player: Player) => void;
    decrement: (player: Player) => void;
    setMax: (player: Player) => void;
    setMin: (player: Player) => void;
}