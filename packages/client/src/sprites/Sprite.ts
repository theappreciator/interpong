import * as PIXI from 'pixi.js';
import { Vector } from '../types';

export interface Sprite {
    getSpriteObj(): PIXI.Graphics;
    update(viewWidth: number, viewHeight: number): void;
    reset(app: PIXI.Application): void;
    remove(app: PIXI.Application): void;
    isCollided(other: Sprite): boolean;
    getCollisionCenter(): Vector;

    get radius(): number;
}