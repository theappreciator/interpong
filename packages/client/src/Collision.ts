import { Sprite } from "./sprites/Sprite";


export default class Collision {
    static checkPlayerAndCoin(player: Sprite, coin: Sprite): boolean{
        if (player.isCollided(coin)) {
            return true;
        }

        return false;
    }

    static checkPlayerAndMonster(player: Sprite, monster: Sprite): boolean {
        if (player.isCollided(monster)) {
            return true;
        }

        return false
    }
}