import { Player } from "~/sprites";
import { HealthStrategy } from "./HealthStrategy";

export class SimpleHealthStrategy implements HealthStrategy {
    takeDamage(player: Player) {
        player.health -= 1;
    }

    gainHealth(player: Player) {
        player.health += 1;
    }
    
    isDead(player: Player) {
        console.log("Checking if dead", player.health);
        if (player.health <= 0) {
            return true;
        }

        return false;
    }
}