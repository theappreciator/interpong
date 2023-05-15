import { GAME_EVENTS, IBallState, IBallUpdateState, IGameRoomState, IPlayData, IPlayerState, IScoreData, IStartGame } from "@interpong/common";
import { Server, Socket } from "socket.io";
import SocketRoomService from "./socketRoomService";
import GameRoomStateService from "./gameRoomStateService";
import GameService from "./gameService";
import SocketPlayerAdapter from "./socketPlayerAdapter";



export interface ISocketGameService {
    addPlayer(roomId: string, socket: Socket): IPlayerState;
    startGame(io: Server, roomId: string): void;
    startGameInProgressForPlayer(io: Server, socket: Socket, roomId: string): void;
    removePlayer(io: Server, socket: Socket, roomId: string, removeAction: (gameRoomState?: IGameRoomState) => void): void;
    receiveBall(io: Server, fromSocket: Socket, ball: IBallUpdateState): void;
    receiveScoreEvent(io: Server, fromSocket: Socket, scoreData: IScoreData): void;
    getRoomFromSocket(socket: Socket): string | undefined;
    broadcastGameRoomState(io: Server, roomId: string, gameRoomState: IGameRoomState): void;
}

class SocketGameService implements ISocketGameService {
    constructor() {

    }

    public addPlayer = (roomId: string, socket: Socket): IPlayerState => {
        const gameService = new GameService(roomId);
        return gameService.addPlayer(socket.id);
    }

    public startGame = (io: Server, roomId: string) => {
        const gameService = new GameService(roomId);
        gameService.startGame(
            (playerStartGameData: IStartGame) => {
                const socket = SocketPlayerAdapter.socketFromPlayer(io, playerStartGameData.player);
                this.sendStartGameToPlayer(socket, playerStartGameData);
            },
            (ball: IBallState, toPlayer: IPlayerState, gameRoomState: IGameRoomState) => {
                this.broadcastGameRoomState(io, roomId, gameRoomState);
                this.sendBallToPlayer(io, roomId, ball, toPlayer);
            }
        );
    }

    public startGameInProgressForPlayer = (io: Server, socket: Socket, roomId: string) => {
        const gameService = new GameService(roomId);
        const player = SocketPlayerAdapter.playerFromSocket(socket);

        gameService.startGameForPlayer(player, (playerStartGameData: IStartGame) => {
            this.sendStartGameToPlayer(socket, playerStartGameData);
        });
    }

    public removePlayer = (io: Server, socket: Socket, roomId: string, removeAction: (gameRoomState?: IGameRoomState) => void): void => {
        const gameService = new GameService(roomId);
        const deletePlayer = SocketPlayerAdapter.playerFromPlayerId(socket.id);
        gameService.removePlayer(deletePlayer, removeAction);
    }


    public receiveBall = (io: Server, fromSocket: Socket, rawBallData: IBallUpdateState): void => {
        const roomId = SocketRoomService.getGameRoomFromPlayerSocket(fromSocket);
        const gameService = new GameService(roomId);
        gameService.transferBallToNextPlayer(rawBallData, (ball: IBallState, toPlayer: IPlayerState, gameRoomState: IGameRoomState) => {
            this.broadcastGameRoomState(io, roomId, gameRoomState);
            this.sendBallToPlayer(io, roomId, ball, toPlayer);
        });
    }

    public receiveScoreEvent = (io: Server, fromSocket: Socket, scoreData: IScoreData): void => {
        const roomId = SocketRoomService.getGameRoomFromPlayerSocket(fromSocket);
        const fromPlayer = SocketPlayerAdapter.playerFromSocket(fromSocket);

        const gameService = new GameService(roomId);
        gameService.updateScore(fromPlayer, scoreData, (gameRoomState: IGameRoomState) => {
            this.broadcastGameRoomState(io, roomId, gameRoomState);
        })
    }

    public getRoomFromSocket = (socket: Socket): string | undefined => {
        // TODO: consider logic to 1) try and get the room from the existing connected socket, then 2) try and get the room from the state service for a disconnected socket
        const roomId = GameRoomStateService.getRoomByPlayerById(socket.id);
        return roomId;
    }

    public broadcastGameRoomState = (io: Server, roomId: string, gameRoomState: IGameRoomState): void => {
        this.sendGameStateToRoom(io, roomId, gameRoomState);
    }


    /*******************/
    /* Socket Senders  */
    /*******************/
    
    private sendStartGameToPlayer = (socket: Socket, playerStartGameData: IStartGame) => {
        socket.emit(GAME_EVENTS.START_GAME, playerStartGameData);
    }

    private sendBallToPlayer = (io: Server, roomId: string, ball: IBallState, player: IPlayerState) => {
        const socket = SocketPlayerAdapter.socketFromPlayer(io, player);
        if (!socket) {
            throw new Error(`Could not get socket for player ${player.id}`)
        }

        socket.emit(GAME_EVENTS.ON_UPDATE_BALL, ball);
    }

    private sendGameStateToRoom = (io: Server, roomId: string, gameRoomState: IGameRoomState) => {
        io.to(roomId).emit(GAME_EVENTS.ON_UPDATE_GAME, gameRoomState);
    }
}

export default SocketGameService;
