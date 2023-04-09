import * as PIXI from 'pixi.js';
import { BallType, ICircle, IRectangle, PlayerType } from "./sprites";
import Shape from "./sprites/Shape";
import { Sprite } from "./sprites/Sprite";
import { Vector } from '@interpong/common';


export default class Collision {

    static checkPlayerAndBall(player: PlayerType, ball: BallType) {
        const collisionPosition = Collision.intersectAABBAndSphere(player, ball);
        const collisionSides = Collision.getSideOfCollision(player, collisionPosition);
        return Collision.getUpdatedDirection(ball, collisionSides);
    }

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

    private static intersectAABBAndSphere(rectangle: IRectangle, circle: ICircle): Vector | undefined {
        // get box closest point to sphere center by clamping
        const x = Math.max(rectangle.leftX, Math.min(circle.center.x, rectangle.rightX));
        const y = Math.max(rectangle.topY, Math.min(circle.center.y, rectangle.bottomY));
      
        // this is the same as isPointInsideSphere
        const distance = Math.sqrt(
          (x - circle.center.x) * (x - circle.center.x) +
            (y - circle.center.y) * (y - circle.center.y)
        );
      
        if (distance < circle.radius) {
            return {x, y};
        }
        
        return undefined
    }

    private static getSideOfCollision(rectangle: IRectangle, position: Vector | undefined) {
        if (!position) {
            return [];
        }

        const sides = [];

        if (position.x === rectangle.leftX) {
            sides.push("left");
        }
        else if (position.x === rectangle.rightX) {
            sides.push("right");
        }

        if (position.y === rectangle.topY) {
            sides.push("top");
        }
        else if (position.y === rectangle.bottomY) {
            sides.push("bottom");
        } 

        return sides;
    }

    private static getUpdatedDirection(ball: BallType, collisionSide: string[]) {
        if (collisionSide.length <= 0) {
            return undefined;
        }

        let newV: Vector = {...ball.v};
        if (ball.v.x > 0 && collisionSide.includes("left")) {
            newV.x = ball.v.x * -1;
        }
        else if (ball.v.x < 0 && collisionSide.includes("right")) {
            newV.x = ball.v.x * -1;
        }
        if (ball.v.y > 0 && collisionSide.includes("top")) {
            newV.y = ball.v.y * -1;
        }
        else if (ball.v.y < 0 && collisionSide.includes("bottom")) {
            newV.y = ball.v.y * -1;
        }

        return newV;
    }
}