import * as PIXI from 'pixi.js';
import { Circle } from "./";
import { SoloMovementEvents } from './events';

export default class Coin extends Circle {
    random(width: number, height: number) {
        this._shape.x = this._radius + Math.random()*(width - 2*this._radius);
        this._shape.y = this._radius + Math.random()*(height - 2*this._radius);
    }

    update(viewWidth: number, viewHeight: number) {
        let s = 1 + Math.sin(new Date().getTime() * 0.01) * 0.2;
        this._shape.scale.set(s, s);

        return [];
    }

    reset(app: PIXI.Application) {
        this.random(app.view.width, app.view.height)
    }
}