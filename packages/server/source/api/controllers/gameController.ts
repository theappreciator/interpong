import { GameStateStatus, GAME_EVENTS, IBallState, IBallUpdateState, IGameRoomState, IPlayData, IPlayerState, IScoreData, IStartGame, randomNumberWithVariance, TeamType, Vector } from "@interpong/common";
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
import { getSomeBalls, getTeam } from "../../util/gameUtils";
import socket from "../../socket";
import { DEFAULTS } from "@interpong/common";
import { getOtherTeam, getPlayerFromSocket, getRandomPlayerFromOtherTeam, getScoreForTeam } from "../../util/gameRoomUtils";
const logger = log4js.getLogger();



@SocketController()
@Service()
export class GameController {

    public async startGame(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomName: string) {
        const roomId = getRoomIdFromName(roomName);
        const socketsInRoom = await getSocketsInRoom(io, roomId);
        const socketsInRoomStr = socketsInRoom.map(s => s.id).join(", ");

        logger.info(chalk.cyan("Starting game:      ", roomId + ":", "[" + socketsInRoomStr + "]"));

        const gameRoomStateService = new GameRoomStateService(roomId);

        const players = gameRoomStateService.getGameRoomState().players
        // const player1 = players.find(p => p.playerNumber === 1);
        // const player2 = players.find(p => p.playerNumber === 2);
        // if (!player1 || !player2 || (players.length != socketsInRoom.length)) {
        //     throw new Error("Could not start game, not all sockets could be identified");
        // }

        const balls = getSomeBalls(players, 1);

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

        // TODO: solve for no undefined below
        for (const ball of balls) {
            const playerWithBall = players.find(p => p.playerNumber === ball.players[0]);
            const socketWithBall = socketsInRoom.find(s => s.id === playerWithBall?.id);

            logger.info(chalk.cyan(`Adding new ball:     ${roomId}: [ ${ball.id}-(${playerWithBall?.team}) px:${ball.lastPosition.x} py:${ball.lastPosition.y} dx:${ball.lastDirection.x} dy:${ball.lastDirection.y}]`));

            setTimeout(() => {
                socketWithBall?.emit(GAME_EVENTS.ON_UPDATE_BALL, ball);
            }, randomNumberWithVariance(DEFAULTS.ball.waitTimeMillisForNext, DEFAULTS.ball.waitTimeMillisForNextVariance));
        }

        gameRoomStateService.updateGameStateStatus(GameStateStatus.GAME_STARTED);
    }

    @OnMessage(GAME_EVENTS.UPDATE_BALL)
    public async updateBall(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() rawBallData: IBallUpdateState
    ) {
        const roomId = getRoomForSocket(socket);

        if (roomId) {
            const gameRoomStateService = new GameRoomStateService(roomId);
            const fromPlayer = gameRoomStateService.getPlayerState(socket.id);
            logger.info(chalk.cyan(`Receive ball update: ${roomId}: [ ${rawBallData.id}-(${fromPlayer.team}) px:${rawBallData.lastPosition.x} py:${rawBallData.lastPosition.y} dx:${rawBallData.lastDirection.x} dy:${rawBallData.lastDirection.y}]`));

            const originalGameRoomState = gameRoomStateService.getGameRoomState();
            const toPlayer = getRandomPlayerFromOtherTeam(originalGameRoomState, fromPlayer.team);

            let needAddMoreBalls = false;

            const incomingBall = {...gameRoomStateService.getBallState(rawBallData.id)};
            // TODO: this is tracked as the highest ever for this room.  The state needs to be cleared with everyone leaves the room.
            const updatedBounces = incomingBall.bounces + 1;
            incomingBall.bounces = updatedBounces;
            incomingBall.lastDirection.x = incomingBall.lastDirection.x * -1
            incomingBall.lastDirection.y = rawBallData.lastDirection.y;
            incomingBall.lastPosition.x = (fromPlayer.team === "left") ? DEFAULTS.ball.offscreenLeft : DEFAULTS.ball.offscreenRight;
            incomingBall.lastPosition.y = rawBallData.lastPosition.y;
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

            const updatedGameRoomState = {...gameRoomStateService.getGameRoomState()};
            updatedGameRoomState.balls = updatedBalls;
            if (updatedGameRoomState.highestBounce < updatedBounces) {
                updatedGameRoomState.highestBounce = updatedBounces;

                if (updatedBounces % DEFAULTS.game.addBallOnBounce === 0) {
                    needAddMoreBalls = true;
                }             
            }
            gameRoomStateService.updateGameRoomState(updatedGameRoomState);

            logger.info(chalk.cyan(`Sending ball update: ${roomId}: [ ${incomingBall.id}-(${toPlayer.id}) px:${incomingBall.lastPosition.x} py:${incomingBall.lastPosition.y} dx:${incomingBall.lastDirection.x} dy:${incomingBall.lastDirection.y}]`));

            const toSocket = io.sockets.sockets.get(toPlayer.id);
            if (!toSocket) {
                throw new Error(`Could not get socket for player ${toPlayer.id}`)
            }
            toSocket.emit(GAME_EVENTS.ON_UPDATE_BALL, incomingBall);

            if (needAddMoreBalls) {
                const newBalls = gameRoomStateService.addSomeBalls(1);
                for (const ball of newBalls) {
                    logger.info(chalk.cyan(`Adding new ball:     ${roomId}: [ ${ball.id}-(${JSON.stringify(ball.players)}) px:${ball.lastPosition.x} py:${ball.lastPosition.y} dx:${ball.lastDirection.x} dy:${ball.lastDirection.y}]`));

                    const validateGameRoomStateService = gameRoomStateService.getGameRoomState();
                    // TODO: this needs to target a single player
                    const addBallToPlayer = validateGameRoomStateService.players.find(p => p.playerNumber === ball.players[0]);
                    if (!addBallToPlayer) {
                        throw new Error("Player state could not be determined when adding a new ball");
                    }
                    const toSocket = io.sockets.sockets.get(addBallToPlayer.id);
                    if (!toSocket) {
                        throw new Error("Player state could not be determined when sending a new ball");
                    }
                    toSocket.emit(GAME_EVENTS.ON_UPDATE_BALL, ball);
                }
            }
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

            const thisPlayer = getPlayerFromSocket(updatedGameRoomState, socket);
            const otherTeamScore = getScoreForTeam(updatedGameRoomState, thisPlayer.team === "left" ? "right" : "left");

            logger.info(chalk.cyan(`Sending game score:  ${roomId}: [ from p${thisPlayer?.playerNumber} new score:${otherTeamScore}]`));
            // socket.to(roomId).emit(GAME_EVENTS.ON_UPDATE_SCORE, updatedGameRoomState);
            io.to(roomId).emit(GAME_EVENTS.ON_UPDATE_SCORE, updatedGameRoomState);
        }
        else {
            logger.info(chalk.red(`Error updateScore()`));
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
