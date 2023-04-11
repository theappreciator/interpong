import { DEFAULTS, GameStateStatus, IBallState, IGameRoomState, IPlayerState, randomColorNumber, randomNumberBetween, randomNumberWithVariance, TeamType, Vector } from "@interpong/common"
import { RemoteSocket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { v4 as uuidv4 } from 'uuid';



function getPlayerNumberWithBall(numberOfPlayers: number) {
    return Math.floor(Math.random() * numberOfPlayers) + 1;
}

function getStartingBalls(numberOfPlayers: number, numberOfBalls: number) {
    const balls: IBallState[] = [];

    for(let i = 1; i <= numberOfBalls; i++) {
        const playerWithBall = getPlayerNumberWithBall(numberOfPlayers);
        const xPos = playerWithBall === 1 ? DEFAULTS.ball.offscreenRight : DEFAULTS.ball.offscreenLeft;
        const yPos = Math.random() * DEFAULTS.width;
        const ballPosition: Vector = {x: xPos, y: yPos};

        const xDir = (playerWithBall === 1 ? -1 : 1) * randomNumberWithVariance(DEFAULTS.ball.direction.x, DEFAULTS.ball.direction.xVariance);
        const yDir = randomNumberWithVariance(DEFAULTS.ball.direction.y, DEFAULTS.ball.direction.yVariance); 
        const ballDirection: Vector = {x: xDir, y: yDir};

        const hue = Math.floor(Math.random() * 361);
        const saturation = randomNumberBetween(70, 100);
        const lightness = randomNumberBetween(30, 90);
        const ball: IBallState = {
            id: uuidv4(),
            color: randomColorNumber(),
            bounces: 0,
            players: [playerWithBall],
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

function getGameRoomStartedState(players: IPlayerState[], balls: IBallState[]) {
    const gameRoomState: IGameRoomState = {
        players: players,
        game: {
            status: GameStateStatus.GAME_STARTED
        },
        balls: balls
    };

    return gameRoomState;
}

export {
    getPlayerNumberWithBall,
    getStartingBalls,
    getStartingPlayers,
    getTeam,
    getGameRoomStartedState
}