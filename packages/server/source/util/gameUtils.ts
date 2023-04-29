import { DEFAULTS, randomItem, IBallState, IPlayerState, randomColorNumber, randomNumberWithVariance, TeamType, Vector, GAME_EVENTS, IBallUpdateState } from "@interpong/common"
import { v4 as uuidv4 } from 'uuid';


function getBallStartPosXForTeam(team: TeamType): number {
    return team === "left" ? DEFAULTS.ball.offscreenRight : DEFAULTS.ball.offscreenLeft;
}

function getBallStartPosForTeam(team: TeamType): Vector {
    const xPos = getBallStartPosXForTeam(team);
    const yPos = Math.random() * DEFAULTS.width;

    return {
        x: xPos,
        y: yPos
    }
}

function getBallStartDirection(team: TeamType): Vector {
    const xDir = (team === "left" ? -1 : 1) * randomNumberWithVariance(DEFAULTS.ball.direction.x, DEFAULTS.ball.direction.xVariance);
    const yDir = randomNumberWithVariance(DEFAULTS.ball.direction.y, DEFAULTS.ball.direction.yVariance); 

    return {
        x: xDir, y: yDir
    };
}

function getSomeBalls(players: IPlayerState[], numberOfBalls: number) {
    const balls: IBallState[] = [];

    for(let i = 1; i <= numberOfBalls; i++) {
        const playerWithBall = randomItem(players);

        if (playerWithBall) {

            const ball: IBallState = {
                id: uuidv4(),
                color: randomColorNumber(),
                bounces: 0,
                players: [playerWithBall.playerNumber],
                lastPosition: getBallStartPosForTeam(playerWithBall.team),
                lastDirection: getBallStartDirection(playerWithBall.team)
            }

            balls.push(ball);
        }
    }

    return balls;
}

function getTeamLogString(fromTeam: TeamType, toTeam?: TeamType): string {
    let ballDisplay;
    let block = '████';
    let arrow = ' ';

    if (toTeam === "left") {
        arrow = "←";
    }
    else if (toTeam === "right") {
        arrow = "→";
    }
    else {
        block = '░░░░';
    }

    if (fromTeam === "left") {
        ballDisplay = `${block}${arrow}   `
    }
    else {
        ballDisplay = `   ${arrow}${block}`
    }

    return `[${ballDisplay}]`
}

export {
    getBallStartPosXForTeam,
    getBallStartPosForTeam,
    getBallStartDirection,
    getSomeBalls,
    getTeamLogString
}