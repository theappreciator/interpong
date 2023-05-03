import { DEFAULTS, IBallState, IBallUpdateState, IPlayerState, TeamType } from "@interpong/common";



const getTransferredBall = (rawBallData: IBallUpdateState, existingBall: IBallState, toPlayer: IPlayerState): IBallState => {
    const updatedPlayers = [...existingBall.players];
    updatedPlayers.push(toPlayer.playerNumber);

    const updatedBall: IBallState = {
        color: existingBall.color,
        bounces: existingBall.bounces + 1,
        players: updatedPlayers,
        id: existingBall.id,
        lastPosition: {
            x: getBallStartPosXForTeam(toPlayer.team),
            y: rawBallData.lastPosition.y            // We have to rely on client data
        },
        lastDirection: {
            x: existingBall.lastDirection.x * -1,     // Rely on server side data 
            y: rawBallData.lastDirection.y          // We have to rely on client data
        }
    }

    return updatedBall;
}

const getBallStartPosXForTeam = (team: TeamType): number => {
    return team === "left" ? DEFAULTS.ball.offscreenRight : DEFAULTS.ball.offscreenLeft;
}

const getLastPlayerFromBall = (ball: IBallState): number => {
    if (ball.players.length === 0) {
        throw new Error("Improper ball data, no players saved with ball");
    }
    const playerNumber = ball.players[ball.players.length - 1];
    return playerNumber;
}

export {
    getTransferredBall,
    getBallStartPosXForTeam,
    getLastPlayerFromBall
}