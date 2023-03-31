import * as PIXI from 'pixi.js';
import { IPlayerShape } from '../types';
import { Vector } from '@interpong/common';
import { SoloMovementEvents } from './events';
import { Sprite } from './Sprite';

export default abstract class Shape implements Sprite {
    protected _v: Vector;
    protected _shape: PIXI.Graphics;
    protected _color: number;
    protected _startPos: Vector;

    constructor(shape: PIXI.Graphics, color: number, v: Vector, startPos: Vector) {
        this._shape = shape;
        this._v = v;
        this._color = color;
        this._startPos = startPos;

        // this.createShape(this._color);        
    }

    // abstract updateShape(): void;
    // updateCircle(color: number) {
    //     this._circle.clear();
    //     this._circle
    //         .beginFill(color)
    //         .drawCircle(0, 0, this._radius)
    //         .endFill();

    // }

    getSpriteObj(): PIXI.Graphics {
        return this._shape;
    }

    abstract update(viewwidth: number, viewHeight: number): SoloMovementEvents[];

    reset(app: PIXI.Application) {
        app.stage.removeChild(this._shape);
    }

    remove(app: PIXI.Application) {
        app.stage.removeChild(this._shape);
    }

    hide(app: PIXI.Application) {
        this._shape.visible = false;
    }

    show(app: PIXI.Application) {
        this._shape.visible = true;
    }

    abstract updateShape(...args: any[]): void;

    abstract isCollided(other: Sprite): boolean;
    // isCollided(other: Sprite) {
    //     const otherCenter = other.getCollisionCenter();
    //     let dx = otherCenter.x - this._shape.x;
    //     let dy = otherCenter.y - this._shape.y;
    //     let dist = Math.sqrt(dx*dx + dy*dy);

    //     const centerToCenter = this._radius + other.radius;

    //     return dist < centerToCenter;
    // }

    getCollisionCenter(): Vector {
        return this.center;
    }

    // get shape(): PIXI.Graphics {
    //     return this._shape;
    // }

    // get circle(): PIXI.Graphics {
    //     return this._circle;
    // }

    // get radius(): number {
    //     return this._radius;
    // }

    get v(): Vector {
        return this._v;
    }

    get center(): Vector {
        return {
            x: this._shape.x,
            y: this._shape.y
        }
    }
}