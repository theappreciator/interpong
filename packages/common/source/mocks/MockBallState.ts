import { IBallState, IPlayerState, Vector } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { DEFAULTS } from "../constants";
import { randomColorNumber, randomNumberBetween, randomNumberWithVariance } from "../utils";





const mockBall: IBallState = {
    id: uuidv4(),
    color: randomColorNumber(),
    bounces: 0,
    players: [1],
    lastPosition: {
        x: 480,
        y: Math.random() * DEFAULTS.width
    },
    lastDirection: {
        x: -4,
        y: ((Math.random() < 0.5) ? -1 : 1) * DEFAULTS.ball.direction.y
    }
};

const getRandomMockBall = (player: IPlayerState) => {
    const xDir = (player.team === "left" ? -1 : 1) * randomNumberWithVariance(DEFAULTS.ball.direction.x, DEFAULTS.ball.direction.xVariance);
    const yPos = Math.random() * DEFAULTS.width;
    const yDir = ((Math.random() < 0.5) ? -1 : 1) * (randomNumberWithVariance(DEFAULTS.ball.direction.y, DEFAULTS.ball.direction.yVariance));
    const mockBall: IBallState = {
        id: uuidv4(),
        color: randomColorNumber(),
        bounces: 0,
        players: [1],
        lastPosition: {
            x: player.team === "left" ? DEFAULTS.ball.offscreenRight : DEFAULTS.ball.offscreenLeft,
            y: yPos
        },
        lastDirection: {
            x: xDir,
            y: yDir
        }
    };

    return mockBall;
}

export {
    mockBall,
    getRandomMockBall
}