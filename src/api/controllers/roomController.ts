import {
    ConnectedSocket,
    MessageBody,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import { Server, Socket } from "socket.io";

const ROOM_IDENTIFIER = "ROOM|";
const ROOM_NUMBER_OF_PLAYERS = 2;

const PLAYER_1 = "x";
const PLAYER_2 = "o";

const JOIN_GAME = "join_game";
const JOIN_GAME_ERROR = JOIN_GAME + "_error";
const ROOM_JOINED = "room_joined";
const START_GAME = "start_game";

const getRoomName = (roomId: string) => {
    return ROOM_IDENTIFIER + roomId;
}

@SocketController()
export class RoomController {
    @OnMessage(JOIN_GAME)
    public async joinGame(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {

        const roomName = getRoomName(message.roomId);
        const socketsInRoom = io.sockets.adapter.rooms.get(roomName);

        console.log("New User joining room:", roomName);

        // const socketRooms = Array.from(socket.rooms.values()).filter(
        //   (r) => r !== socket.id
        // );

        console.log("Number of users already room " + roomName + ": " + (socketsInRoom?.size || 0));

        // Uncertain why there is a check for max size in the this room AND other rooms also existing
        // if (
        //   socketRooms.length > 0 ||
        //   (socketsInRoom && socketsInRoom.size === 2)
        // ) {
        if (socketsInRoom?.size === ROOM_NUMBER_OF_PLAYERS) {
            console.log("Could not join room.  Max size already hit.");
            socket.emit(JOIN_GAME_ERROR, {
                error: "Room is full please choose another room to play!",
            });
        } else {
            try {
            await socket.join(roomName);

            const updatedSocketsInRoom = io.sockets.adapter.rooms.get(roomName);

            socket.emit(ROOM_JOINED);

            console.log("Room " + roomName + " joined.  Number of users in room: " + updatedSocketsInRoom?.size || 0) + ":";
            console.log(updatedSocketsInRoom)

            if (updatedSocketsInRoom?.size === ROOM_NUMBER_OF_PLAYERS) {
                this.startGame(socket, roomName);
            }
        }
        catch (e) {
            console.log("There was an error!", e);
        }
        }
    }

    private async startGame(socket: Socket, roomName: string) {
        socket.emit(START_GAME, { start: true, symbol: PLAYER_1 });
        socket
            .to(roomName)
            .emit(START_GAME, { start: false, symbol: PLAYER_2 });
        console.log("Game is starting!");
    }
}
