import { Vector } from '../types';
import { Ball, Circle } from './';
import { SoloMovementEvents } from './events';

export type TransferTypes = "left" | "right" | "top" | "bottom";

export default class TransferBall extends Circle implements Ball {

    private _transferTypes: TransferTypes[];

    constructor(color: number, radius: number, v: Vector, startPos: Vector | undefined, transferTypes: TransferTypes[]) {

        super(color, radius, v, startPos);

        this._transferTypes = transferTypes;
       
    }

    update(viewWidth: number, viewHeight: number) {

        let returnMovementEvent: SoloMovementEvents[] = [];

        this._circle.x += this._v.x;
        this._circle.y += this._v.y;

        if (this._v.x >= 0 && this._circle.x >= viewWidth - this._radius) {
            if (this._transferTypes.includes("right")) {
                returnMovementEvent = [SoloMovementEvents.HIT_RIGHT_WALL];
                if (this._circle.x >= viewWidth + this._radius) {
                    returnMovementEvent.push(SoloMovementEvents.TRANSFERRED_RIGHT_WALL);
                }
            }
            else {
                this._v.x *= -1;
            }
        }

        else if (this._v.x <= 0 && this._circle.x <= this._radius) {
            if (this._transferTypes.includes("left")) {
                returnMovementEvent = [SoloMovementEvents.HIT_LEFT_WALL];
                if (this._circle.x <= (-1 * this._radius)) {
                    returnMovementEvent.push(SoloMovementEvents.TRANSFERRED_LEFT_WALL);
                }
            }
            else {
                this._v.x *= -1;
            }
        }

        if (this._v.y >= 0 && this._circle.y >= viewHeight - this._radius) {
            if (this._transferTypes.includes("bottom")) {
                returnMovementEvent = [SoloMovementEvents.HIT_BOTTOM_WALL];
                if (this._circle.y >= viewHeight + this._radius) {
                    returnMovementEvent.push(SoloMovementEvents.TRANSFERRED_BOTTOM_WALL);
                }
            }
            else {
                this._v.y *= -1;
            }
            
        }
        else if (this._v.y <= 0 && this._circle.y <= this._radius) {
            if (this._transferTypes.includes("top")) {
                returnMovementEvent = [SoloMovementEvents.HIT_TOP_WALL];
                if (this._circle.y <= (-1 * this._radius)) {
                    returnMovementEvent.push(SoloMovementEvents.TRANSFERRED_TOP_WALL);
                }
            }
            else {
                this._v.y *= -1;
            }
        }

        return returnMovementEvent;
    }
}