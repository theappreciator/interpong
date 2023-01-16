import {
    ConnectedSocket,
    MessageBody,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import { Server, Socket } from "socket.io";

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

    @OnMessage("update_game")
    public async updateGame(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {
        const gameRoom = this.getGameRoom(socket);

        if (gameRoom)
            socket.to(gameRoom).emit("on_game_update", message);
        else
            console.log("Error updateGame()");
    }

    @OnMessage("game_win")
    public async gameWin(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {
        const gameRoom = this.getGameRoom(socket);

        if (gameRoom)
            socket.to(gameRoom).emit("on_game_win", message);
        else
            console.log("Error gameWin()");
    }
}
