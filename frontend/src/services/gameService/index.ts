import { IPlayMatrix, IStartGame } from "../../components/game";
import BaseService from "../baseService.ts";

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
        roomId: string
    ): Promise<boolean> {
        return new Promise((rs, rj) => {
            let socket;

            try {
                socket = this.getSocket();
            }
            catch {
                return rj();
            }

            socket.emit("join_game", { roomId });

            socket.on("room_joined", () => rs(true));
            socket.on("join_game_error", ({ error }) => rj(error)); 
        });
    }

    public async updateGame(
        gameMatrix: IPlayMatrix
    ) {
        const socket = this.getSocket();

        socket.emit("update_game", { matrix: gameMatrix });
    }

    public async onGameUpdate(
        listener: (matrix: IPlayMatrix) => void
    ) {
        const socket = this.getSocket();
 
        socket.on("on_game_update", ({ matrix }) => listener(matrix));
    }

    public async onStartGame(
        listener: (options: IStartGame) => void
    ) {
        console.log("Executing service: onStartGame()");
        const socket = this.getSocket();
        console.log("Listening for game on socket", socket);
        console.log("Is there a listener?", listener);

        socket.on("start_game", listener);
    }

    public async gameWin(
        message: string
    ) {
        const socket = this.getSocket();

        socket.emit("game_win", { message });
    }

    public async onGameWin(
        listener: (message: string) => void
    ) {
        const socket = this.getSocket();

        socket.on("on_game_win", ({ message }) => listener(message));
    }
}

export default GameService;
