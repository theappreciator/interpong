import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { IPlayMatrix, IStartGame } from "../../components/game";
import BaseService from "../baseService.ts";
import { GAME_EVENTS, ROOM_EVENTS } from "@interpong/common";


class GameService extends BaseService {

    private static _instance: GameService;

    private constructor() {
        super();
    }

    public static get Instance() {
        if (this._instance) {
            console.log("GameService: returning existing");
            // console.log(this._instance.onStartGame);
            // const socket = this._instance.getSocket();
            // console.log(socket);
            return this._instance;
        }
        else {
            console.log("GameService: making new");
            return this._instance = new this();
        }
		// return this._instance || (this._instance = new this());
	}

    public async joinGameRoom(
        roomId: string,
    ): Promise<boolean> {
        return new Promise((rs, rj) => {
            let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

            try {
                socket = this.getSocket();
            }
            catch {
                return rj();
            }

            socket.on(ROOM_EVENTS.ROOM_JOINED, () => {
                socket.emit(ROOM_EVENTS.ROOM_JOINED, "my answer");
                rs(true);
            });
            socket.on(ROOM_EVENTS.JOIN_GAME_ERROR, ({ error }) => rj(error)); 

            console.log("---> setting the default listener");
            socket.on(GAME_EVENTS.START_GAME, () => console.log("---> Default listener for start_game"));

            socket.on(ROOM_EVENTS.ROOM_READY, (thing: (arg0: string) => void) => {
                console.log("We were notified the room is ready!");
                // socket.emit("hello", "world");
                // socket.emit("room_ready", "hello tere");
                thing("asdasdadas");
            });

            socket.emit(ROOM_EVENTS.JOIN_GAME, { roomId });
        });
    }

    public async onRoomReady(
        listener: (isRoomReady: boolean) => void
    ) {
        const socket = this.getSocket();

        socket.on(ROOM_EVENTS.ROOM_READY, listener);
    }

    public async updateGame(
        gameMatrix: IPlayMatrix
    ) {
        const socket = this.getSocket();

        socket.emit(GAME_EVENTS.UPDATE_GAME, { matrix: gameMatrix });
    }

    public async onGameUpdate(
        listener: (matrix: IPlayMatrix) => void
    ) {
        const socket = this.getSocket();
 
        socket.on(GAME_EVENTS.ON_UPDATE_GAME, ({ matrix }) => listener(matrix));
    }

    public async onStartGame(
        listener: (options: IStartGame) => void
    ) {
        console.log("Executing service: onStartGame()");
        const socket = this.getSocket();
        console.log("Listening for game on socket", socket);
        console.log("Is there a listener?", listener);

        socket.off(GAME_EVENTS.START_GAME);
        console.log("---> setting the real listener");
        socket.on(GAME_EVENTS.START_GAME, listener);
    }

    public async gameWin(
        message: string
    ) {
        const socket = this.getSocket();

        socket.emit(GAME_EVENTS.WIN_GAME, { message });
    }

    public async onGameWin(
        listener: (message: string) => void
    ) {
        const socket = this.getSocket();

        socket.on(GAME_EVENTS.ON_WIN_GAME, ({ message }) => listener(message));
    }
}

export default GameService;
