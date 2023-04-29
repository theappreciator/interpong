import { DEFAULTS, GAME_EVENTS, IBallState, IBallUpdateState, IGameRoomState, IPlayData, IPlayerState, IScoreData, IStartGame } from "@interpong/common";
import { Server, Socket } from "socket.io";
import SocketRoomService from "./socketRoomService";
import GameRoomStateService from "./gameRoomStateService";
import GameService from "./gameService";
import { getRoomIdFromName, getSocketsInRoom } from "../util/roomUtils";
import SocketPlayerAdapter from "./socketPlayerAdapter";



export interface ISocketGameService {
    startGame(io: Server, roomName: string): void;
    receiveBall(io: Server, fromSocket: Socket, ball: IBallUpdateState): void;
    receiveScoreEvent(io: Server, fromSocket: Socket, scoreData: IScoreData): void;
}

class SocketGameService implements ISocketGameService {



    constructor() {

    }

    public startGame(io: Server, roomName: string) {
        const roomId = getRoomIdFromName(roomName);

        const gameService = new GameService(roomId);
        gameService.startGame(
            (playerStartGameData: IStartGame) => {
                const socket = SocketPlayerAdapter.socketFromPlayer(io, playerStartGameData.player);
                socket.emit(GAME_EVENTS.START_GAME, playerStartGameData);
            },
            (ball: IBallState, toPlayer: IPlayerState) => {
                this.sendBallToPlayer(io, roomId, ball, toPlayer);
            }
        );
    }

    public receiveBall(io: Server, fromSocket: Socket, rawBallData: IBallUpdateState): void{
        const roomId = SocketRoomService.getGameRoomFromPlayerSocket(fromSocket);
        const gameService = new GameService(roomId);
        gameService.transferBallToNextPlayer(rawBallData, (ball: IBallState, toPlayer: IPlayerState) => {
            this.sendBallToPlayer(io, roomId, ball, toPlayer);
        });
    }

    public receiveScoreEvent(io: Server, fromSocket: Socket, scoreData: IScoreData): void {
        const roomId = SocketRoomService.getGameRoomFromPlayerSocket(fromSocket);
        const fromPlayer = SocketPlayerAdapter.playerFromSocket(fromSocket);

        const gameService = new GameService(roomId);
        gameService.updateScore(fromPlayer, scoreData, (gameRoomState: IGameRoomState) => {
            this.sendScoreUpdate(io, roomId, gameRoomState)
        })
    }

    /*******************/
    /* Socket Senders  */
    /*******************/
    
    private sendBallToPlayer(io: Server, roomId: string, ball: IBallState, player: IPlayerState) {
        const socket = SocketPlayerAdapter.socketFromPlayer(io, player);
        if (!socket) {
            throw new Error(`Could not get socket for player ${player.id}`)
        }

        socket.emit(GAME_EVENTS.ON_UPDATE_BALL, ball);
    }

    // private sendBallToNextPlayer(io: Server, roomId: string, ball: IBallState) {
    //     const playerNumberToFind = ball.players[ball.players.length - 1];
    //     const playerWithBall = SocketPlayerAdapter.playerFromPlayerNumber(roomId, playerNumberToFind);
    //     if (!playerWithBall) {
    //         throw new Error(`Could not get player for number ${playerNumberToFind}`)
    //     }
    
    //     this.sendBallToPlayer(io, roomId, ball, playerWithBall);
    // }

    private sendScoreUpdate(io: Server, roomId: string, gameRoomState: IGameRoomState) {
        io.to(roomId).emit(GAME_EVENTS.ON_UPDATE_SCORE, gameRoomState);
    }
}

export default SocketGameService;
