import * as PIXI from 'pixi.js';
import { ICircle } from '.';
import { Vector } from '@interpong/common';
import { SoloMovementEvents } from './events';
import Shape from './Shape';
import { Sprite } from './Sprite';

export default class BouncingBall extends Shape implements ICircle {

    private _radius: number;
    private _ballId: string;

    constructor(color: number, radius: number, v: Vector, startPos: Vector, ballId: string, ){

        let circle = new PIXI.Graphics();
        circle.x = startPos?.x || 0 + radius;
        circle.y = startPos?.y || 0 + radius;
        circle
            .beginFill(color)
            .drawCircle(0, 0, radius)
            .endFill();

        super(circle, color, v, startPos);

        this._radius = radius;
        this._ballId = ballId;       
    }

    get radius(): number {
        return this._radius;
    }

    get ballId(): string {
        return this._ballId;
    }

    updateShape(position?: Vector, direction?: Vector, color?: number, radius?: number) {
        if (position) {
            this._shape.x = position.x;
            this._shape.y = position.y;
        }

        if (direction) {
            this._v.x = direction.x,
            this._v.y = direction.y
        }

        if (color) {
            this._color = color;
        }

        if (radius) {
            this._radius = radius;
        }

        this._shape.clear()
            .beginFill(this._color)
            .drawCircle(0, 0, this._radius)
            .endFill();
    }

    // TODO: needs TransferBall's logic to not get trapped out of bounds
    update(viewWidth: number, viewHeight: number) {
        let returnMovementEvent: SoloMovementEvents[] = [];

        this._shape.x += this._v.x;
        this._shape.y += this._v.y;

        if (this._shape.x >= viewWidth - this._radius) {
            this._v.x *= -1;
            returnMovementEvent.push(SoloMovementEvents.HIT_RIGHT_WALL);
        }

        else if (this._shape.x <= this._radius) {
            this._v.x *= -1;
            returnMovementEvent.push(SoloMovementEvents.HIT_LEFT_WALL);
        }

        if (this._shape.y >= viewHeight - this._radius) {
            this._v.y *= -1;
            returnMovementEvent.push(SoloMovementEvents.HIT_BOTTOM_WALL);
        }
        else if (this._shape.y <= this._radius) {
            this._v.y *= -1;
            returnMovementEvent.push(SoloMovementEvents.HIT_TOP_WALL);
        }

        return returnMovementEvent;
    }

    isCollided(other: Sprite): boolean {
        // TODO: need to implement

        return false;
    }
}