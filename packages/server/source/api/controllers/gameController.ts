import { GAME_EVENTS } from "@interpong/common";
import {
    ConnectedSocket,
    MessageBody,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import { Server, Socket } from "socket.io";

const PLAYER_1 = "x";
const PLAYER_2 = "o";

@SocketController()
export class GameController {
    private getGameRoom(socket: Socket): string {
        const socketRooms = Array.from(socket.rooms.values()).filter(
            (r) => r !== socket.id
        );

        // Assumption - a socket can only be in 1) it's private room, and 2) a single game room
        const gameRoom = socketRooms && socketRooms[0];

        return gameRoom;
    }

    private async startGame(socket: Socket, roomName: string) {       
        console.log("Emitting from socket [" + socket.id + "] [" + GAME_EVENTS.START_GAME + "] to room [" + roomName + "] start:false"); 
        socket
            .to(roomName)
            .emit(GAME_EVENTS.START_GAME, { start: false, symbol: PLAYER_2 });

        console.log("Emitting to socket [" + socket.id + "] [" + GAME_EVENTS.START_GAME + "] start:true"); 

        socket.emit(GAME_EVENTS.START_GAME, { start: true, symbol: PLAYER_1 });

        console.log("Game is starting!");
    }

    @OnMessage(GAME_EVENTS.READY_FOR_GAME)
    public async readyForGame(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {
        const gameRoom = this.getGameRoom(socket);

        if (gameRoom) {
            this.startGame(socket, gameRoom);
        }
        else {
            console.log("Error readyForGame()");
        }
    }

    @OnMessage(GAME_EVENTS.UPDATE_GAME)
    public async updateGame(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {
        const gameRoom = this.getGameRoom(socket);

        if (gameRoom)
            socket.to(gameRoom).emit(GAME_EVENTS.ON_UPDATE_GAME, message);
        else
            console.log("Error updateGame()");
    }

    @OnMessage(GAME_EVENTS.WIN_GAME)
    public async gameWin(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {
        const gameRoom = this.getGameRoom(socket);

        if (gameRoom)
            socket.to(gameRoom).emit(GAME_EVENTS.ON_WIN_GAME, message);
        else
            console.log("Error gameWin()");
    }
}
