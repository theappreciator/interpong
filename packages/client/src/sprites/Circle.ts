import * as PIXI from 'pixi.js';
import { Vector } from '../types';
import { SoloMovementEvents } from './events';
import { Sprite } from './Sprite';

export default abstract class Circle implements Sprite {
    protected _radius: number;
    protected _v: Vector;
    protected _circle: PIXI.Graphics;
    protected _color: number;

    constructor(color: number, radius: number, v: Vector, startPos: Vector | undefined) {
        this._radius = radius;
        this._v = v;
        this._color = color;

        let circle = new PIXI.Graphics();
        circle.x = startPos?.x || 0 + radius;
        circle.y = startPos?.y || 0 + radius;
        this._circle = circle;

        this.updateCircle(this._color);        
    }

    updateCircle(color: number) {
        this._circle.clear();
        this._circle
            .beginFill(color)
            .drawCircle(0, 0, this._radius)
            .endFill();

    }

    getSpriteObj(): PIXI.Graphics {
        return this._circle;
    }

    abstract update(viewwidth: number, viewHeight: number): SoloMovementEvents;

    reset(app: PIXI.Application) {
        app.stage.removeChild(this._circle);
    }

    remove(app: PIXI.Application) {
        app.stage.removeChild(this._circle);
    }

    isCollided(other: Sprite) {
        const otherCenter = other.getCollisionCenter();
        let dx = otherCenter.x - this._circle.x;
        let dy = otherCenter.y - this._circle.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        const centerToCenter = this._radius + other.radius;

        return dist < centerToCenter;
    }

    getCollisionCenter(): Vector {
        return {
            x: this._circle.x,
            y: this._circle.y
        }
    }

    get circle(): PIXI.Graphics {
        return this._circle;
    }

    get radius(): number {
        return this._radius;
    }

    get v(): Vector {
        return this._v;
    }
}