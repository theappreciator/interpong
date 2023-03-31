import * as PIXI from 'pixi.js';
import { ICircle } from '.';
import { Vector } from '@interpong/common';
import { SoloMovementEvents } from './events';
import Shape from './Shape';
import { Sprite } from './Sprite';

export default class Circle extends Shape implements ICircle {
    protected _radius: number;

    constructor(color: number, radius: number, v: Vector, startPos: Vector) {

        let circle = new PIXI.Graphics();
        circle.x = startPos?.x || 0 + radius;
        circle.y = startPos?.y || 0 + radius;
        circle
            .beginFill(color)
            .drawCircle(0, 0, radius)
            .endFill();

        super(circle, color, v, startPos);

        this._radius = radius;

        // this.updateCircle();        
    }

    updateShape(position?: Vector, color?: number, radius?: number) {
        let updatedPosition: Vector;
        if (position) {
            updatedPosition = {...position}
        }
        else {
            updatedPosition = {
                x:this._shape.x,
                y:this._shape.y
            }
        }

        if (color) {
            this._color = color;
        }

        if (radius) {
            this._radius = radius;
        }

        this._shape.clear()
            .beginFill(this._color)
            .drawCircle(updatedPosition.x, updatedPosition.y, this._radius)
            .endFill();
    }

    get radius(): number {
        return this._radius;
    }

    update(viewWidth: number, viewHeight: number) {
        let returnMovementEvent: SoloMovementEvents[] = [];

        return [];
    }

    isCollided(other: Sprite) {
        const otherCenter = other.getCollisionCenter();
        let dx = otherCenter.x - this._shape.x;
        let dy = otherCenter.y - this._shape.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        //const centerToCenter = this._radius + other.radius;

        //return dist < centerToCenter;

        return false;
    }

    getCollisionCenter(): Vector {
        return this.center;
    }
    
}