import { Circle } from './';

export default class Monster extends Circle {
    update(viewWidth: number, viewHeight: number) {
        this._circle.x += this._v.x;
        this._circle.y += this._v.y;

        if (this._circle.x >= viewWidth - this._radius) {
            //shake(this._board.app, "right");
            this._v.x *= -1;
        }

        else if (this._circle.x <= this._radius) {
            //shake(this._board.app, "left");
            this._v.x *= -1;
        }

        if (this._circle.y >= viewHeight - this._radius) {
            //shake(this._board.app, "down");
            this._v.y *= -1;
        }
        else if (this._circle.y <= this._radius) {
            //shake(this._board.app, "up");
            this._v.y *= -1;
        }

        //console.log(this._circle.x, this._circle.y, this._v.x, this._v.y);
    }
}