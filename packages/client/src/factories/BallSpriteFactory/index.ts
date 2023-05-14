import { IBallState, IPlayerState } from "@interpong/common";
import { BallType } from "../../sprites";

export * from "./transferBallSpriteFactory";
export * from "./bouncingBallSpriteFactory";

export interface IBallSpriteFactory {
    makeBallSprite(ballState: IBallState, player: IPlayerState): BallType;
}
