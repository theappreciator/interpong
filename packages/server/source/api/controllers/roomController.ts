import {
    ConnectedSocket,
    MessageBody,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import { Namespace, Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { ROOM_CONSTANTS, ROOM_EVENTS } from "@interpong/common";



const getRoomName = (roomId: string) => {
    return ROOM_CONSTANTS.ROOM_IDENTIFIER + roomId;
}

@SocketController()
export class RoomController {
    @OnMessage(ROOM_EVENTS.JOIN_GAME)
    public async joinGame(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: any
    ) {

        const roomName = getRoomName(message.roomId);
        const socketsInRoom = io.sockets.adapter.rooms.get(roomName);

        console.log("New User [" + socket.id + "] joining room:", roomName);

        // const socketRooms = Array.from(socket.rooms.values()).filter(
        //   (r) => r !== socket.id
        // );

        console.log("Number of users already room " + roomName + ": " + (socketsInRoom?.size || 0));

        // Uncertain why there is a check for max size in the this room AND other rooms also existing
        // if (
        //   socketRooms.length > 0 ||
        //   (socketsInRoom && socketsInRoom.size === 2)
        // ) {
        if (socketsInRoom?.size === ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS) {
            console.log("Could not join room.  Max size already hit.");
            socket.emit(ROOM_EVENTS.JOIN_GAME_ERROR, {
                error: "Room is full please choose another room to play!",
            });
        } else {
            try {
                await socket.join(roomName);

                const updatedSocketsInRoom = io.sockets.adapter.rooms.get(roomName);

                socket.emit(ROOM_EVENTS.ROOM_JOINED, (answer: any) => {
                    console.log("---> THERE WAS AN ANSWER", answer);
                });

                console.log("Room " + roomName + " joined.  Number of users in room: " + updatedSocketsInRoom?.size || 0) + ":";
                console.log(updatedSocketsInRoom)

                if (updatedSocketsInRoom?.size === ROOM_CONSTANTS.ROOM_NUMBER_OF_PLAYERS_TO_START) {
                    this.roomReady2(io.sockets, roomName);
                }
            }
            catch (e) {
                console.log("There was an error!", e);
            }
        }
    }

    private async roomReady2(sockets: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomName: string) {      
        
        console.log("About to ask all clients to get ready");
        sockets.timeout(5000).emit(ROOM_EVENTS.ROOM_READY, (err: any, responses: any) => {
            if (err) {
                console.log("Clients did not all reply in 5000ms");
              // some clients did not acknowledge the event in the given delay
            } else {
              console.log(responses); // one response per client
            }
          });

    }
    
    private async roomReady(socket: Socket, roomName: string) {       
        console.log("Emitting from socket [" + socket.id + "] [" + ROOM_EVENTS.ROOM_READY + "] to room [" + roomName + "]"); 
        socket
            .to(roomName)
            .emit(ROOM_EVENTS.ROOM_READY);

        console.log("Emitting to socket [" + socket.id + "] [" + ROOM_EVENTS.ROOM_READY + "]"); 

        socket.emit(ROOM_EVENTS.ROOM_READY);

        console.log("Room is joined and waiting on both clients to confirm!");
    }
}
