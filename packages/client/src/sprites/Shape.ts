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
    protected _activated: boolean;

    constructor(shape: PIXI.Graphics, color: number, v: Vector, startPos: Vector) {
        this._shape = shape;
        this._v = v;
        this._color = color;
        this._startPos = startPos;

        this._activated = false;
    }

    get activated(): boolean {
        return this._activated;
    }

    set activated(b: boolean) {
        this._activated = b;
    }

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

    getCollisionCenter(): Vector {
        return this.center;
    }

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