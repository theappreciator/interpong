import * as PIXI from 'pixi.js';
import { Vector } from '@interpong/common';
import { SoloMovementEvents } from './events';
import Shape from './Shape';
import { Sprite } from './Sprite';

export default abstract class Rectangle extends Shape implements Sprite {
    protected _height: number;
    protected _width: number;
    // protected _v: Vector;
    // protected _shape: PIXI.Graphics;
    // protected _color: number;
    declare _shape: PIXI.Graphics;

    constructor(color: number, width: number, height: number, v: Vector, startPos: Vector | undefined) {

        let rectangle = new PIXI.Graphics();
        rectangle.x = startPos?.x || 0 + (width / 2);
        rectangle.y = startPos?.y || 0 + (height / 2);
        rectangle
            .beginFill(color)
            .drawRect(0, 0, width, height)
            .endFill();
        // this._shape = rectangle;

        super(rectangle, color, v, startPos);

        this._height = height;
        this._width = width;

        // this.updateShape();        
    }

    // updateShape() {
    //     this._shape.clear();
    //     this._shape
    //         .beginFill(this._color)
    //         .drawRect(0, 0, this._width, this._height)
    //         .endFill();
    // }

    // getSpriteObj(): PIXI.Graphics {
    //     return this._shape;
    // }

    // abstract update(viewwidth: number, viewHeight: number): SoloMovementEvents[];

    // reset(app: PIXI.Application) {
    //     app.stage.removeChild(this._shape);
    // }

    // remove(app: PIXI.Application) {
    //     app.stage.removeChild(this._shape);
    // }

    isCollided(other: Sprite) {
        const otherCenter = other.getCollisionCenter();
        let dx = otherCenter.x - this._shape.x;
        let dy = otherCenter.y - this._shape.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        //const cen2terToCenter = this._radius + other.radius;

        //return dist < centerToCenter;

        return false;
    }

    getCollisionCenter(): Vector {
        return this.center;
    }

    // get rectangle(): PIXI.Graphics {
    //     return this._shape;
    // }

    // // get radius(): number {
    // //     return this._radius;
    // // }

    // get v(): Vector {
    //     return this._v;
    // }

    // get center(): Vector {
    //     return {
    //         x: this._shape.x,
    //         y: this._shape.y
    //     }
    // }
}