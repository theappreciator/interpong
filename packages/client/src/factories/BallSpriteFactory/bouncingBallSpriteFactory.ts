import { DEFAULTS, IBallState, IPlayerState } from "@interpong/common";
import { IBallSpriteFactory } from ".";
import { BallType, BouncingBall } from "../../sprites";



class BouncingBallSpriteFactory implements IBallSpriteFactory {
    constructor() {

    }

    makeBallSprite = (ballState: IBallState, player: IPlayerState): BallType => {
        return this.makeBouncingBall(ballState);
    }

    private makeBouncingBall = (ballState: IBallState): BallType => {
        const ballSprite = new BouncingBall(ballState.color, DEFAULTS.ball.radius, ballState.lastDirection, ballState.lastPosition, ballState.id);
        return ballSprite;
    }
}

export default BouncingBallSpriteFactory;