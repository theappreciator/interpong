import { GameStateStatus, GAME_EVENTS, IBallState, IBallUpdateState, IGameRoomState, IPlayData, IPlayerState, IScoreData, IStartGame, randomNumberWithVariance, Vector } from "@interpong/common";
import {
    ConnectedSocket,
    MessageBody,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import {Service} from 'typedi';
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import chalk from "chalk";
import * as log4js from "log4js";
import { getRoomForSocket, getRoomIdFromName, getSocketIdsInRoom, getSocketsInRoom } from "../../util/roomUtils";
import GameRoomStateService from "../../services/gameRoomStateService";
import { getGameRoomStartedState, getPlayerNumberWithBall, getStartingBalls, getStartingPlayers } from "../../util/gameUtils";
import socket from "../../socket";
import { DEFAULTS } from "@interpong/common";
const logger = log4js.getLogger();



@SocketController()
@Service()
export class GameController {

    public async startGame(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomName: string) {
        const roomId = getRoomIdFromName(roomName);
        const socketsInRoom = await getSocketsInRoom(io, roomId);
        const socketsInRoomStr = socketsInRoom.map(s => s.id).join(", ");

        logger.info(chalk.cyan("Starting game:      ", roomId + ":", "[" + socketsInRoomStr + "]"));

        // TODO: need to reconcile how to update the game state to started and verify the ball state is saved as well
        const gameRoomStateService = new GameRoomStateService(roomId);

        const players = gameRoomStateService.getGameRoomState().players
        const player1 = players.find(p => p.playerNumber === 1);
        const player2 = players.find(p => p.playerNumber === 2);
        if (!player1 || !player2 || (players.length != socketsInRoom.length)) {
            throw new Error("Could not start game, not all sockets could be identified");
        }

        const balls = getStartingBalls(2, 5);

        const gameRoomState = gameRoomStateService.updateGameStateStatusStarting(balls);

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const playerStartGameData: IStartGame= {
                start: true,
                player: player,
                state: gameRoomState
            };
            const socket = socketsInRoom.find(s => s.id === player.id);
            if (!socket) {
                throw new Error("Could not get socket from player");
            }
            socket.emit(GAME_EVENTS.START_GAME, playerStartGameData);
        }

        // TODO solve for no undefined below
        for (const ball of balls) {
            const playerWithBall = players.find(p => p.playerNumber === ball.players[0]);
            const socketWithBall = socketsInRoom.find(s => s.id === playerWithBall?.id);

            setTimeout(() => {
                socketWithBall?.emit(GAME_EVENTS.ON_UPDATE_BALL, ball);
            }, randomNumberWithVariance(DEFAULTS.ball.waitTimeMillisForNext, DEFAULTS.ball.waitTimeMillisForNextVariance));
        }

        gameRoomStateService.updateGameStateStatus(GameStateStatus.GAME_STARTED);
    }

    @OnMessage(GAME_EVENTS.UPDATE_GAME)
    public async updateGame(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: IPlayData
    ) {
        const roomId = getRoomForSocket(socket);

        if (roomId) {
            logger.info(chalk.cyan(`Sending game update: ${roomId}: [ px:${message.position.x} py:${message.position.y} dx:${message.direction.x} dy:${message.direction.y}]`));
            socket.to(roomId).emit(GAME_EVENTS.ON_UPDATE_GAME, message);
        }
        else {
            console.log("Error updateGame()");  
        }
    }

    @OnMessage(GAME_EVENTS.UPDATE_BALL)
    public async updateBall(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: IBallUpdateState
    ) {
        const roomId = getRoomForSocket(socket);

        if (roomId) {
            logger.info(chalk.cyan(`Receive ball update: ${roomId}-${socket.id}: [ ${message.id} px:${message.lastPosition.x} py:${message.lastPosition.y} dx:${message.lastDirection.x} dy:${message.lastDirection.y}]`));

            const gameRoomStateService = new GameRoomStateService(roomId);
            const originalGameRoomState = gameRoomStateService.getGameRoomState();
            const fromPlayer = gameRoomStateService.getPlayerState(socket.id);
            const incomingBall = {...gameRoomStateService.getBallState(message.id)};

            incomingBall.bounces = incomingBall.bounces + 1;
            incomingBall.lastDirection.x = incomingBall.lastDirection.x * -1
            incomingBall.lastDirection.y = message.lastDirection.y;
            incomingBall.lastPosition.x = fromPlayer.playerNumber === 1 ? DEFAULTS.ball.offscreenLeft : DEFAULTS.ball.offscreenRight;
            incomingBall.lastPosition.y = message.lastPosition.y;
            incomingBall.players.push(fromPlayer.playerNumber);

            const updatedBalls = [];
            for (let i = 0; i < originalGameRoomState.balls.length; i++) {
                const originalBall = originalGameRoomState.balls[i];
                if (originalBall.id === incomingBall.id) {
                    updatedBalls.push(incomingBall);
                }
                else {
                    updatedBalls.push({...originalBall});
                }
            }

            const gameRoomState = {...gameRoomStateService.getGameRoomState()};
            gameRoomState.balls = updatedBalls;
            gameRoomStateService.updateGameRoomState(gameRoomState);

            logger.info(chalk.cyan(`Sending ball update: ${roomId}: [ ${incomingBall.id} px:${incomingBall.lastPosition.x} py:${incomingBall.lastPosition.y} dx:${incomingBall.lastDirection.x} dy:${incomingBall.lastDirection.y}]`));

            socket.to(roomId).emit(GAME_EVENTS.ON_UPDATE_BALL, incomingBall);
        }
        else {
            console.log("Error updateGame()");  
        }
    }

    @OnMessage(GAME_EVENTS.UPDATE_SCORE)
    public async updateScore(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: IScoreData
    ) {
        const roomId = getRoomForSocket(socket);

        if (roomId) {
            
            const gameRoomStateService = new GameRoomStateService(roomId);
            const updatedGameRoomState = gameRoomStateService.updatePlayerScore(socket.id, message.event);
            const thisPlayer = updatedGameRoomState.players.find(f => f.id === socket.id);
            const otherPlayer = updatedGameRoomState.players.find(f => f.id !== socket.id);

            logger.info(chalk.cyan(`Sending game score:  ${roomId}: [ from p${thisPlayer?.playerNumber} to p${otherPlayer?.playerNumber} new score:${otherPlayer?.score}]`));
            // socket.to(roomId).emit(GAME_EVENTS.ON_UPDATE_SCORE, updatedGameRoomState);
            io.to(roomId).emit(GAME_EVENTS.ON_UPDATE_SCORE, updatedGameRoomState);
        }
        else {
            console.log("Error updateScore()");
        }
    }

    // TODO: Winning should be decided server side and sent to client
    @OnMessage(GAME_EVENTS.WIN_GAME)
    public async gameWin(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {
        const gameRoom = getRoomForSocket(socket);

        if (gameRoom)
            socket.to(gameRoom).emit(GAME_EVENTS.ON_WIN_GAME, message);
        else
            console.log("Error gameWin()");
    }
}
