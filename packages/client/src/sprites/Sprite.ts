import * as PIXI from 'pixi.js';
import { Vector } from '../types';
import { SoloMovementEvents } from './events';

export interface Sprite {
    getSpriteObj(): PIXI.Graphics;
    update(viewWidth: number, viewHeight: number): SoloMovementEvents;
    reset(app: PIXI.Application): void;
    remove(app: PIXI.Application): void;
    isCollided(other: Sprite): boolean;
    getCollisionCenter(): Vector;

    get radius(): number;
}