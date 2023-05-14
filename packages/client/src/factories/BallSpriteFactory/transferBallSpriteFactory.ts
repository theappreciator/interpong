import { DEFAULTS, getOppositeTeamType, IBallState, IPlayerState } from "@interpong/common";
import { IBallSpriteFactory } from ".";
import { BallType } from "../../sprites";
import TransferBall, { TransferTypes } from "../../sprites/TransferBall";



class TransferBallSpriteFactory implements IBallSpriteFactory {
    constructor() {

    }

    makeBallSprite = (ballState: IBallState, player: IPlayerState): BallType => {
        return this.makeTransferBall(ballState, player);
    }

    private makeTransferBall = (ballState: IBallState, player: IPlayerState): BallType => {
        const exitSide: TransferTypes = getOppositeTeamType(player.team);

        const ballSprite = new TransferBall(ballState.color, DEFAULTS.ball.radius, ballState.lastDirection, ballState.lastPosition, ballState.id, [exitSide]);
        return ballSprite;
    }
}

export default TransferBallSpriteFactory;