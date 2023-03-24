export { default as Circle } from "./Circle";
export { default as Player } from "./Player";
export { default as Monster } from "./Monster";
export { default as Coin } from "./Coin";
export { default as BouncingBall } from "./BouncingBall";
export { default as TransferBall } from "./TransferBall";

import Circle from "./Circle";

export interface Ball extends Circle {};