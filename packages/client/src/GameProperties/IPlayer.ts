import { Vector } from "@interpong/common";

export interface IPlayer {
    position: Vector;
    activated: boolean;
    moveLeft(): void;
    stopLeft(): void;
    moveUp(): void;
    stopUp(): void;
    moveRight(): void;
    stopRight(): void;
    moveDown(): void;
    stopDown(): void;
    stopMoving(): void;
    slowDown(): void;
    speedUp(): void;
    takeDamage(): void;
    gainHealth(): void;
}