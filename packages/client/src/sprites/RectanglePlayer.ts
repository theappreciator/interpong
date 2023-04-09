import * as PIXI from 'pixi.js';
import { HealthStrategy } from '../strategies/HealthStrategy';
import { DEFAULTS } from "../constants";
import { MoveStrategy } from '../strategies/MoveStrategy';
import { SpeedStrategy } from '../strategies/SpeedStrategy';
import { Vector } from '@interpong/common';
import { SoloMovementEvents } from './events';
import Shape from './Shape';
import { Sprite } from './Sprite';
import { IRectangle } from '.';
import { parseIsolatedEntityName } from 'typescript';

export class PlayerDeadError extends Error {

}

export interface RectanglePlayerShape {
    position?: Vector,
    color?: number,
    width?: number,
    height?: number
}

export const RectanglePlayerShapeHit: RectanglePlayerShape = {
    position: undefined,
    color: 0xff22ff,
    width: undefined,
    height: undefined 
}

export const RectanglePlayerShapePointed: RectanglePlayerShape = {
    position: undefined,
    color: 0xcccccc,
    width: undefined,
    height: undefined 
}

export default class RectanglePlayer extends Shape implements IRectangle {
    private _height: number;
    private _width: number;
    private _speed!: number;
    private _moveStrategy: MoveStrategy;
    private _speedStrategy: SpeedStrategy;
    private _healthStrategy: HealthStrategy;
    private _health: number;
    private _isInvulnerable: boolean;
    private _normalShape: RectanglePlayerShape;
    private _shapeChanged: RectanglePlayerShape;

    constructor(
        color: number,
        width: number,
        height: number,
        v: Vector,
        startPos: Vector,
        moveStrategy: MoveStrategy,
        speedStrategy: SpeedStrategy,
        healthStrategy: HealthStrategy
    ) {

        let rectangle = new PIXI.Graphics();
        rectangle.x = startPos.x;
        rectangle.y = startPos.y;
        rectangle
            .beginFill(color)
            .drawRect(0, 0, width, height)
            .endFill();

        super(rectangle, color, v, startPos);

        this._normalShape = {
            position: {x:startPos.x, y:startPos.y},
            color,
            width,
            height
        }
        this._shapeChanged = {
            position: undefined,
            color: undefined,
            width: undefined,
            height: undefined
        }
        
        this._height = height;
        this._width = width;

        this._moveStrategy = moveStrategy;
        this._speedStrategy = speedStrategy;
        this._healthStrategy = healthStrategy;

        this._health = DEFAULTS.player.health;
        this._isInvulnerable = false;

        this._moveStrategy.setPointerEvents(this);
    }

    getNormalShape(): RectanglePlayerShape {
        return this._normalShape;
    }
    
    // TODO: a way to set the normal shape

    updateShape(shapeProps?: RectanglePlayerShape) {
        const hadProps = shapeProps !== undefined;
        let hadChanges = false;
        if (!shapeProps) {
            shapeProps = {...this._shapeChanged};
            this._shapeChanged = {
                position: undefined,
                color: undefined,
                width: undefined,
                height: undefined
            }
        }
        
        if (shapeProps.position) {
            if (hadProps) this._shapeChanged.position = {...shapeProps.position};
            hadChanges = true;
            this._shape.x = shapeProps.position.x;
            this._shape.y = shapeProps.position.y;
        }

        if (shapeProps.color) {
            if (hadProps) this._shapeChanged.color = this._normalShape.color;
            hadChanges = true;
            this._color = shapeProps.color;
        }

        if (shapeProps.width) {
            if (hadProps) this._shapeChanged.width = shapeProps.width;
            hadChanges = true;
            this._width = shapeProps.width;
        }

        if (shapeProps.height) {
            if (hadProps) this._shapeChanged.height = shapeProps.height;
            hadChanges = true;
            this._height = shapeProps.height;
        }

        if (hadChanges) {
            this._shape.clear()
                .beginFill(this._color)
                .drawRect(0, 0, this._width, this._height)
                .endFill();
        }
    }

    get center(): Vector {
        return {
            x: this._shape.x + this._width / 2,
            y: this._shape.y + this._height / 2
        }
    }

    get leftX(): number {
        return this.center.x - this._width / 2;
    }

    get rightX(): number {
        return this.center.x + this._width / 2;
    }

    get topY(): number {
        return this.center.y - this._height / 2;
    }

    get bottomY(): number {
        return this.center.y + this._height / 2;
    }

    reset(app: PIXI.Application) {
        this._shape.x = this._startPos.x; //app.view.width / 2;
        this._shape.y = this._startPos.y; //app.view.height / 2;
        this._v = {x: 0, y: 0};
        this._speed = DEFAULTS.player.speed;
        this._health = DEFAULTS.player.health;

        // TODO: do we need to call super.reset() to remove from the playing field?
    }

    update(viewWidth: number, viewHeight: number) {
        let x = this._shape.x + (this._v.x * this._speed);
        let y = this._shape.y + (this._v.y * this._speed);

        const clampedX = Math.min(Math.max(x, 0), viewWidth - this._width);
        const clampedY = Math.min(Math.max(y, 0), viewHeight - this._height);

        this._shape.x = clampedX; 
        this._shape.y = clampedY;

        return [];
    }

    isCollided(other: Sprite): boolean {
        // const otherInstance = (other instanceof)
        // if (other instanceof Ball)

        return false;
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

            //this.updateCircle(this._color);

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