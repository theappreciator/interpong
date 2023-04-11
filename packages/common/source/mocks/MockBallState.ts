import { IBallState } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { DEFAULTS } from "../constants";
import { randomColorNumber } from "../utils";





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

const getRandomMockBall = (playerNumber: number) => {
    const mockBall: IBallState = {
        id: uuidv4(),
        color: randomColorNumber(),
        bounces: 0,
        players: [1],
        lastPosition: {
            x: playerNumber % 2 === 1 ? 532 : -20,
            y: Math.random() * DEFAULTS.width
        },
        lastDirection: {
            x: -4,
            y: ((Math.random() < 0.5) ? -1 : 1) * DEFAULTS.ball.direction.y
        }
    };

    return mockBall;
}

export {
    mockBall,
    getRandomMockBall
}