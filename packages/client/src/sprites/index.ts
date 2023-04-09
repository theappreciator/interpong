export { default as Circle } from "./Circle";
export { default as Player } from "./RectanglePlayer";
export { default as Monster } from "./Monster";
export { default as Coin } from "./Coin";
export { default as BouncingBall } from "./BouncingBall";
export { default as TransferBall } from "./TransferBall";

import { Vector } from '@interpong/common';
import BouncingBall from "./BouncingBall";
import RectanglePlayer from "./RectanglePlayer";
import TransferBall from "./TransferBall";

export type BallType = TransferBall | BouncingBall;
export type PlayerType = RectanglePlayer;

export interface ICircle {
    center: Vector;
    radius: number;
};

export interface IRectangle {
    center: Vector;
    leftX: number;
    rightX: number;
    topY: number;
    bottomY: number;
};

export interface IPolygon {};