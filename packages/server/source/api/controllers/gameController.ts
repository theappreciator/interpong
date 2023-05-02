import { GAME_EVENTS, IBallUpdateState, IScoreData } from "@interpong/common";
import {
    ConnectedSocket,
    MessageBody,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import {Service} from 'typedi';
import { Server, Socket } from "socket.io";
import * as log4js from "log4js";
import { getRoomForSocket } from "../../util/roomUtils";
import SocketGameService from "../../services/socketGameService";
const logger = log4js.getLogger();



@SocketController()
@Service()
class GameController {

    @OnMessage(GAME_EVENTS.UPDATE_BALL)
    public async updateBall(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() rawBallData: IBallUpdateState
    ) {
        try {
            const socketGameService = new SocketGameService();
            socketGameService.receiveBall(io, socket, rawBallData);
        } catch (e: unknown) {
            logger.error("Error in updateBall()", e);
        }
    }

    @OnMessage(GAME_EVENTS.UPDATE_SCORE)
    public async updateScore(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() scoreData: IScoreData
    ) {
        try {
            const socketGameService = new SocketGameService();
            socketGameService.receiveScoreEvent(io, socket, scoreData);
        } catch (e: unknown) {
            logger.error("Error in updateScore()", e);
        }
    }

    // TODO: Winning should be decided server side and sent to client
    @OnMessage(GAME_EVENTS.WIN_GAME)
    public async gameWin(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {
        try {

            const gameRoom = getRoomForSocket(socket);

            if (gameRoom)
                socket.to(gameRoom).emit(GAME_EVENTS.ON_WIN_GAME, message);
            else
                console.log("Error gameWin()");

        } catch (e: unknown) {
            logger.error("Error in gameWin()", e);
        }
    }
}

export default GameController;
