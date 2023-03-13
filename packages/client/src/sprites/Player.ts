import * as PIXI from 'pixi.js';
import { HealthStrategy } from '../strategies/HealthStrategy';
import { DEFAULTS } from "../constants";
import { MoveStrategy } from '../strategies/MoveStrategy';
import { SpeedStrategy } from '../strategies/SpeedStrategy';
import { Vector } from '../types';
import { Circle } from "./";

export class PlayerDeadError extends Error {

}

export default class Player extends Circle {
    private _speed!: number;
    private _moveStrategy: MoveStrategy;
    private _speedStrategy: SpeedStrategy;
    private _healthStrategy: HealthStrategy;
    private _health: number;
    private _isInvulnerable: boolean;

    constructor(
        color: number,
        radius: number,
        v: Vector, 
        startPos: Vector,
        moveStrategy: MoveStrategy,
        speedStrategy: SpeedStrategy,
        healthStrategy: HealthStrategy
    ) {

        super(color, radius, v, startPos);

        this._moveStrategy = moveStrategy;
        this._speedStrategy = speedStrategy;
        this._healthStrategy = healthStrategy;

        this._health = DEFAULTS.player.health;
        this._isInvulnerable = false;
    }

    reset(app: PIXI.Application) {
        this._circle.x = app.view.width / 2;
        this._circle.y = app.view.height / 2;
        this._v = {x: 0, y: 0};
        this._speed = DEFAULTS.speed;
        this._health = DEFAULTS.player.health;
    }

    update(viewWidth: number, viewHeight: number) {
        let x = this._circle.x + (this._v.x * this._speed);
        let y = this._circle.y + (this._v.y * this._speed);

        // update our location
        this._circle.x = Math.min(Math.max(x, this._radius), viewWidth - this._radius);
        this._circle.y = Math.min(Math.max(y, this._radius), viewHeight - this._radius);

        //console.log(this._circle.x, this._circle.y);
    }

    moveLeft() {
       this._moveStrategy.moveLeft(this);
    }

    stopLeft() {
       this._moveStrategy.stopLeft(this);
    }

    moveUp() {
        this._moveStrategy.moveUp(this);
    }

    stopUp() {
        this._moveStrategy.stopUp(this);
    }

    moveRight() {
        this._moveStrategy.moveRight(this);
    }

    stopRight() {
        this._moveStrategy.stopRight(this);
    }

    moveDown() {
        this._moveStrategy.moveDown(this);
    }

    stopDown() {
        this._moveStrategy.stopDown(this);
    }

    slowDown() {
        this._speedStrategy.decrement(this);
    }

    speedUp() {
        this._speedStrategy.increment(this);
    }

    takeDamage() {
        // There is a bug in the invulerable logic.  Multiple timers are getting triggered and causing real damage.
        if (!this._isInvulnerable) {
            this._healthStrategy.takeDamage(this);

            if (this._healthStrategy.isDead(this)) {
                return true;
            }

            this.flash();
        }

        return false;
    }

    gainHealth() {
        this._healthStrategy.gainHealth(this);
    }

    flash() {
        const baseColor = this._color;

        const flashCountTotal = DEFAULTS.player.invulnerableMillis / DEFAULTS.player.flashMillis;
        let flashCounter = 0;

        this._isInvulnerable = true;

        const flashInterval = setInterval(() => {
            if (flashCounter >= flashCountTotal) {
                this._isInvulnerable = false;
                this._color = baseColor;
                clearInterval(flashInterval);
            }
            else {
                this._color = (this._color === baseColor) ? 0xDE3249 : baseColor;
                flashCounter += 1;
            }

            this.updateCircle(this._color);

        }, DEFAULTS.player.flashMillis);
    }

    get speed(): number {
        return this._speed;
    }

    set speed(speed: number) {
        this._speed = speed;
    }

    get health(): number {
        return this._health;
    }

    set health(health: number) {
        this._health = health;
    }
}