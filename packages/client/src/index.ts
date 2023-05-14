import { SocketService } from "./services";
import { mockStartGame, randomNumberWithVariance } from '@interpong/common';
import { GamePageController, SocketGameRoomController } from './controllers/';
import MockGameRoomController from './controllers/__mocks__/MockGameRoomController';
import TransferBallSpriteFactory from "./factories/BallSpriteFactory/transferBallSpriteFactory";
import BouncingBallSpriteFactory from "./factories/BallSpriteFactory/bouncingBallSpriteFactory";
import RectanglePlayerSpriteFactory from "./factories/PlayerSpriteFactory/rectanglePlayerSpriteFactory";
import BasicBoardFactory from "./factories/BoardFactory/basicBoardFactory";
import { PlayingGameState } from "./GameStates";



const testGame = true;

if (!testGame) {
    const url = process.env.SOCKET_SERVER_URL;
    if (!url) {
        throw new Error("No url provided!");
    }
    const networkService = SocketService.Instance; // TODO: move this to dependency injection
    const gameController = new SocketGameRoomController(url, networkService);
    const ballSpriteFactory = new TransferBallSpriteFactory();
    const playerSpriteFactory = new RectanglePlayerSpriteFactory();
    const boardFactory = new BasicBoardFactory();
    const pageController = new GamePageController(gameController, ballSpriteFactory, playerSpriteFactory, boardFactory);
    pageController.initiate();
}

// Dummy in the game board
if (testGame) {
    const gameRoomController = new MockGameRoomController();
    const ballSpriteFactory = new BouncingBallSpriteFactory();
    const playerSpriteFactory = new RectanglePlayerSpriteFactory();
    const boardFactory = new BasicBoardFactory();
    const pageController = new GamePageController(gameRoomController, ballSpriteFactory, playerSpriteFactory, boardFactory);
    pageController.initiate();

    const state = new PlayingGameState(pageController);
    pageController.setGameState(state);

    gameRoomController.startTestGame(mockStartGame);

    const makeTestBalls = async () => {
        const testBalls = 1;
        const timeBetweenBalls = 500;

        for (let i = 0; i < testBalls; i++) {
            console.log("Just made a test ball");

            gameRoomController.makeTestBall();
            await new Promise(resolve => setTimeout(resolve, randomNumberWithVariance(timeBetweenBalls, timeBetweenBalls)));
        }
    };
    makeTestBalls();
}
