import * as PIXI from 'pixi.js';
import { ICircle } from '.';
import { Vector } from '@interpong/common';
import { SoloMovementEvents } from './events';
import Shape from './Shape';
import { Sprite } from './Sprite';

export type TransferTypes = "left" | "right" | "top" | "bottom";

export default class TransferBall extends Shape implements ICircle {

    private _radius: number;
    private _ballId: string;
    private _transferTypes: TransferTypes[];

    constructor(color: number, radius: number, v: Vector, startPos: Vector, ballId: string, transferTypes: TransferTypes[]) {

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
        this._transferTypes = transferTypes;
       
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

    update(viewWidth: number, viewHeight: number) {
        let returnMovementEvent: SoloMovementEvents[] = [];

        this._shape.x += this._v.x;
        this._shape.y += this._v.y;

        if (this._v.x >= 0 && this._shape.x >= viewWidth - this._radius) {
            returnMovementEvent = [SoloMovementEvents.HIT_RIGHT_WALL];

            if (this._transferTypes.includes("right")) {
                if (this._shape.x >= viewWidth + this._radius) {
                    returnMovementEvent.push(SoloMovementEvents.TRANSFERRED_RIGHT_WALL);
                }
            }
            else {
                this._v.x *= -1;
                this._shape.x += (this._v.x * 2);
            }
        }

        else if (this._v.x <= 0 && this._shape.x <= this._radius) {
            returnMovementEvent = [SoloMovementEvents.HIT_LEFT_WALL];

            if (this._transferTypes.includes("left")) {
                if (this._shape.x <= (-1 * this._radius)) {
                    returnMovementEvent.push(SoloMovementEvents.TRANSFERRED_LEFT_WALL);
                }
            }
            else {
                this._v.x *= -1;
                this._shape.x += (this._v.x * 2);
            }
        }

        if (this._v.y >= 0 && this._shape.y >= viewHeight - this._radius) {
            returnMovementEvent = [SoloMovementEvents.HIT_BOTTOM_WALL];

            if (this._transferTypes.includes("bottom")) {
                if (this._shape.y >= viewHeight + this._radius) {
                    returnMovementEvent.push(SoloMovementEvents.TRANSFERRED_BOTTOM_WALL);
                }
            }
            else {
                this._v.y *= -1;
                this._shape.y += (this._v.y * 2);
            }
            
        }
        else if (this._v.y <= 0 && this._shape.y <= this._radius) {
            returnMovementEvent = [SoloMovementEvents.HIT_TOP_WALL];

            if (this._transferTypes.includes("top")) {
                if (this._shape.y <= (-1 * this._radius)) {
                    returnMovementEvent.push(SoloMovementEvents.TRANSFERRED_TOP_WALL);
                }
            }
            else {
                this._v.y *= -1;
                this._shape.y += (this._v.y * 2);
            }
        }

        return returnMovementEvent;
    }

    isCollided(other: Sprite): boolean {
        // TODO: need to implement

        return false;
    }
}