import { INetworkService, INetworkServiceConsumer, IRoomService, SocketService } from "../../services";
import { IGameRoomReturn, IPlayData, IScoreData, IStartGame } from '@interpong/common';
import { Socket } from "socket.io-client";
import { IGameRoomController } from "..";
import { SocketError } from "../../utils/errors/socketError";
import { GAME_EVENTS, ROOM_CONSTANTS, ROOM_EVENTS } from "@interpong/common";
import { IGameRoomState } from "@interpong/common";


const TIMEOUT_JOIN_GAME_ROOM = 1000;

class SocketGameRoomController implements IGameRoomController<Socket> {

    private url: string;
    private socket: Socket | undefined;

    private _onConnected: (socket: Socket) => void = (socket) => { this.socket = socket; console.log("Default SocketGameRoomController onConnected") };
    private _onReConnected: (socket: Socket) => void = (socket) => { this.socket = socket; console.log("Default SocketGameRoomController onReConnected") };
	private _onDisconnected: (message: string) => void = () => {console.log("Default SocketGameRoomController onDisconnected")};
    private _onDisconnectedFromRoom: (roomId: string) => void = () => {};
    private _onRoomReadyToStartGame: (roomId: string) => void = () => {};
    private _onPing: () => void = () => {};
    private _onPong: () => void = () => {};
    private _onStartGame: (startGameData: IStartGame) => void = (startGameData) => {console.log("Default SocketGameRoomController onStartGame", startGameData)};
    private _onGameFocusEnter: (playData: IPlayData) => void = (playData) => {console.log("Default SocketGameRoomController onGameFocusEnter", playData)};
    private _onGameScoreChange: (gameRoomState: IGameRoomState) => void = (gameRoomState) => {console.log("Default ScoketGameRoomController onGameScoreChange", gameRoomState)};

    private networkService: INetworkService<Socket>

    public constructor(
        url: string,
        networkService: SocketService
    ) {
        this.url = url;

        this.networkService = networkService;
        this.networkService.onDisconnected((message) => this._onDisconnected(message));
        this.networkService.onReConnected((socket) => this._onReConnected(socket));
        this.networkService.onPing(() => this._onPing());
        this.networkService.onPong(() => this._onPong());
    }
    
    /* ACTIONS */

    public connect() {
        // TODO: probably want to do something different if the socket exists but is disconnected.  Otherwise we will get a new socket id which may be undesirable.
        // TODO: probably want to do something different than check !this.socket, as this method is intended to be called just once
        if (!this.socket || this.socket.disconnected) {
            
            this.networkService.createConnector(this.url)
            .then((socket) => {
                console.log("Completed connecting to " + this.url);

                this.socket = socket;

                this._onConnected(socket);

                this.setupAsyncOnEvents();
            })
            .catch((err) => {
                throw new SocketError({
                    name: "SOCKET_NOT_CONNECTED",
                    message: "Socket is not connected",
                    cause: "connectServer()"
                });
            });
        }
    }

    public joinGameRoom(roomName: string): Promise<string> {
        return new Promise<string>((rs, rj) => {
            if (!this.socket) {
                throw new SocketError({
                    name: "SOCKET_NOT_CONNECTED",
                    message: "Socket is not connected",
                    cause: "joinGameRoom()"
                });
            }

            this.socket.on(ROOM_EVENTS.JOIN_ROOM_SUCCESS, ({ roomId }: IGameRoomReturn) => {
                if (!roomId.startsWith(ROOM_CONSTANTS.ROOM_IDENTIFIER) && !roomId.endsWith(roomName)) {
                    this.removeSyncRoomJoinEvents(timeout);
                    rj("event " + ROOM_EVENTS.JOIN_ROOM_SUCCESS + " name mismatch " + roomName);
                }

                this.removeSyncRoomJoinEvents(timeout);
                rs(roomId);
            });

            this.socket.on(ROOM_EVENTS.JOIN_ROOM_ERROR, ({ error }) => {
                this.removeSyncRoomJoinEvents(timeout);
                rj(error)
            }); 

            console.log("About to emit", ROOM_EVENTS.JOIN_ROOM);
            this.socket.emit(ROOM_EVENTS.JOIN_ROOM, { roomName });
            
            const timeout = setTimeout(() => {
                this.removeSyncRoomJoinEvents();
                rj("Event: Join Game Room timed out")
            }, TIMEOUT_JOIN_GAME_ROOM);
        });
    }
    
    public leaveGameRoom(roomName: string): Promise<void> {
        throw new Error("Method not implemented.");

        /*
        // TODO: implement leaving a room.  As is, disconnect() will disconnect the entire socket, not just this one room
        return new Promise((rs, rj) => {
            try {
                this.socket.disconnect();
                rs();
            } catch (e) {
                rj(e);
            }
        });
        */
    }

    public listGameRooms(): Promise<string[]> {
        throw new Error("Method not implemented.");
    }

    public listUsersInGameRoom(roomName: string): Promise<string[]> {
        throw new Error("Method not implemented.");
    }

    public async doPing(): Promise<void> {
        if (this.socket) {
            this.networkService.doPing(this.socket);
        }
        else {
            throw new SocketError({
                name: "SOCKET_NOT_CONNECTED",
                message: "Socket is not connected",
                cause: "doPing()"
            });
        }
    }

    public doGameFocusLeave(playData: IPlayData): void {
        if (!this.socket) {
            throw new SocketError({
                name: "SOCKET_NOT_CONNECTED",
                message: "Socket is not connected",
                cause: "doPing()"
            });
        }

        console.log("About to emit", GAME_EVENTS.UPDATE_GAME, playData);

        this.socket.emit(GAME_EVENTS.UPDATE_GAME, playData);
    }

    public doGameScoreChange(scoreData: IScoreData): void {
        if (!this.socket) {
            throw new SocketError({
                name: "SOCKET_NOT_CONNECTED",
                message: "Socket is not connected",
                cause: "doPing()"
            });
        }

        console.log("About to emit", GAME_EVENTS.UPDATE_SCORE, scoreData);

        this.socket.emit(GAME_EVENTS.UPDATE_SCORE, scoreData);
    }
    
    /* END ACTIONS */

    /* EVENTS */

    public onConnected(listener: () => void) {
        this._onConnected = (socket) => {
            this.socket = socket;
            listener();
        }
    }

    public onReConnected(listener: () => void) {
        console.log("Setting SocketGameRoomController onReConnected()");
        this._onReConnected = (socket) => {
            this.socket = socket;
            listener();
        }
    }

    public onDisconnected(listener: (message: string) => void) {
        console.log("Setting SocketGameRoomController onDisconnected()");
        this._onDisconnected = listener;
    }

    public onDisconnectedFromRoom(listener: (roomId: string) => void): void {
        this._onDisconnectedFromRoom = listener;
    }

    public onRoomReadyToStartGame(listener: (roomId: string) => void): void {
        this._onRoomReadyToStartGame = listener;
    }

    public onStartGame(listener: (options: IStartGame) => void): void {
        console.log("Setting SocketGameRoomController onStartGame()");
        this._onStartGame = listener;
    }

    public onGameFocusEnter(listener: (playData: IPlayData) => void): void {
        console.log("Setting SocketGameRoomController onGameFocusEnter()");
        this._onGameFocusEnter = listener;
    }

    public onGameScoreChange(listener: (gameRoomState: IGameRoomState) => void): void {
        console.log("Setting SocketGameRoomController onGameScoreChange()");
        this._onGameScoreChange = listener;
    }

    public onGameCompleted(listener: () => void): void {
        throw new Error("Method not implemented.");
    }

    public onPing(listener: () => void): void {
        this._onPing = listener;
    }

    public onPong(listener: () => void): void {
        this._onPong = listener;
    }

    /* END EVENTS */

    /* PRIVATE HELPERS */

    private setupAsyncOnEvents() {
        if (!this.socket) {
            throw new SocketError({
                name: "SOCKET_NOT_CONNECTED",
                message: "Socket is not connected",
                cause: "setupOnEvents()"
            });
        }

        this.socket.on(ROOM_EVENTS.ROOM_DISCONNECT, (roomId) => this._onDisconnectedFromRoom(roomId));

        this.socket.on(ROOM_EVENTS.ROOM_READY, ({ roomId }: IGameRoomReturn, ack: (value: string) => void) => {
            console.log(`We were notified room ${roomId} is ready!`);
            ack("ACK");
            this._onRoomReadyToStartGame(roomId);
        });

        this.socket.on(GAME_EVENTS.START_GAME, (startGameData) => this._onStartGame(startGameData));
        this.socket.on(GAME_EVENTS.ON_UPDATE_GAME, (playData) => this._onGameFocusEnter(playData));
        this.socket.on(GAME_EVENTS.ON_UPDATE_SCORE, (gameRoomState) => this._onGameScoreChange(gameRoomState));
    }

    private removeSyncRoomJoinEvents(timeout?: NodeJS.Timeout) {
        if (timeout)
            clearTimeout(timeout);
        
        this.socket?.off(ROOM_EVENTS.JOIN_ROOM_SUCCESS);
        this.socket?.off(ROOM_EVENTS.JOIN_ROOM_ERROR);
    }

    /* END PRIVATE HELPERS */

}

export default SocketGameRoomController;