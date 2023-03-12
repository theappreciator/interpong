import Player from "~/sprites/Player";


export interface HealthStrategy {
    takeDamage: (player: Player) => void;
    gainHealth: (player: Player) => void;
    isDead: (player: Player) => boolean;
}