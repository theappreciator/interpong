import { GameStateStatus, GAME_EVENTS, IGameRoomState, IPlayData, IPlayerState, IScoreData } from "@interpong/common";
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
import { getRoomForSocket, getSocketsInRoom } from "../../util/roomUtils";
import GameRoomStateService from "../../services/gameRoomStateService";
import { IStartGame } from "@interpong/common";
const logger = log4js.getLogger();

const PLAYER_1 = "x";
const PLAYER_2 = "o";

@SocketController()
@Service()
export class GameController {

    public async startGame(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomName: string) {
        const socketsInRoom = io.sockets.adapter.rooms.get(roomName) || new Set<string>();
        const socketsInRoomStr = Array.from(socketsInRoom).join(", ");

        logger.info(chalk.cyan("Starting game:      ", roomName + ":", "[" + socketsInRoomStr + "]"));

        const sockets = await getSocketsInRoom(io, roomName);

        const player1: IPlayerState = {
            id: sockets[0].id,
            player: 1,
            score: 0
        };
        const player2: IPlayerState = {
            id: sockets[1].id,
            player: 2,
            score: 0
        };
        const players = [];
        players.push(player1);
        players.push(player2);
        const gameRoomState: IGameRoomState = {
            players: players,
            game: {
                status: GameStateStatus.GAME_STARTED,
                currentPlayer: 1
            }
        };
        sockets[0].emit(GAME_EVENTS.START_GAME, { start: true, player: player1.player, state: gameRoomState} );
        sockets[1].emit(GAME_EVENTS.START_GAME, { start: true, player: player2.player, state: gameRoomState} );
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

            logger.info(chalk.cyan(`Sending game score:  ${roomId}: [ from: player:${thisPlayer?.player} score:${thisPlayer?.score}]`));
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

    // @OnMessage(GAME_EVENTS.READY_FOR_GAME)
    // public async readyForGame(
    //     @SocketIO() io: Server,
    //     @ConnectedSocket() socket: Socket,
    //     @MessageBody() message: any
    // ) {
    //     const gameRoom = getRoomForSocket(socket);

    //     if (gameRoom) {
    //         this.startGame(socket, gameRoom);
    //     }
    //     else {
    //         console.log("Error readyForGame()");
    //     }
    // }
}
