import { DEFAULTS, randomItem, IBallState, IPlayerState, randomColorNumber, randomNumberWithVariance, TeamType, Vector } from "@interpong/common"
import { RemoteSocket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { v4 as uuidv4 } from 'uuid';



function getSomeBalls(players: IPlayerState[], numberOfBalls: number) {
    const balls: IBallState[] = [];

    for(let i = 1; i <= numberOfBalls; i++) {
        const playerWithBall = randomItem(players);
        const xPos = playerWithBall.team === "left" ? DEFAULTS.ball.offscreenRight : DEFAULTS.ball.offscreenLeft;
        const yPos = Math.random() * DEFAULTS.width;
        const ballPosition: Vector = {x: xPos, y: yPos};

        const xDir = (playerWithBall.team === "left" ? -1 : 1) * randomNumberWithVariance(DEFAULTS.ball.direction.x, DEFAULTS.ball.direction.xVariance);
        const yDir = randomNumberWithVariance(DEFAULTS.ball.direction.y, DEFAULTS.ball.direction.yVariance); 
        const ballDirection: Vector = {x: xDir, y: yDir};

        const ball: IBallState = {
            id: uuidv4(),
            color: randomColorNumber(),
            bounces: 0,
            players: [playerWithBall.playerNumber],
            lastPosition: ballPosition,
            lastDirection: ballDirection
        }

        balls.push(ball);
    }

    return balls;
}

function getStartingPlayers(sockets: RemoteSocket<DefaultEventsMap, any>[]): IPlayerState[] {
    const players: IPlayerState[] = [];
    for (let i = 0; i < sockets.length; i++) {
        const playerNumber = i + 1;
        const player: IPlayerState = {
            id: sockets[i].id,
            playerNumber: playerNumber,
            team: getTeam(playerNumber),
            score: 0
        }
        players.push(player);
    }

    return players;
}

// TODO: obviously this needs to be updated to evenly distribute players to teams
function getTeam(playerNumber: number): TeamType {
    if (playerNumber % 2 == 0) {
        return "right";
    }
    else {
        return "left";
    }
}

export {
    getSomeBalls,
    getStartingPlayers,
    getTeam
}