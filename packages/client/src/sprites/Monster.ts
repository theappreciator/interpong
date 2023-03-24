import { Circle } from './';
import { SoloMovementEvents } from './events';

export default class Monster extends Circle {
    update(viewWidth: number, viewHeight: number) {

        let returnMovementEvent: SoloMovementEvents[] = [];

        this._circle.x += this._v.x;
        this._circle.y += this._v.y;

        if (this._circle.x >= viewWidth - this._radius) {
            //shake(this._board.app, "right");
            this._v.x *= -1;
            returnMovementEvent = [SoloMovementEvents.HIT_RIGHT_WALL];
        }

        else if (this._circle.x <= this._radius) {
            //shake(this._board.app, "left");
            this._v.x *= -1;
            returnMovementEvent = [SoloMovementEvents.HIT_LEFT_WALL];
        }

        if (this._circle.y >= viewHeight - this._radius) {
            //shake(this._board.app, "down");
            this._v.y *= -1;
            returnMovementEvent = [SoloMovementEvents.HIT_BOTTOM_WALL];
        }
        else if (this._circle.y <= this._radius) {
            //shake(this._board.app, "up");
            this._v.y *= -1;
            returnMovementEvent = [SoloMovementEvents.HIT_TOP_WALL];
        }

        //console.log(this._circle.x, this._circle.y, this._v.x, this._v.y);

        return returnMovementEvent;
    }
}