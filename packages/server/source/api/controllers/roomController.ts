import {
    ConnectedSocket,
    MessageBody,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import {Service} from 'typedi';
import { Namespace, Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { GAME_EVENTS, ROOM_CONSTANTS, ROOM_EVENTS } from "@interpong/common";
import chalk from "chalk";
import * as log4js from "log4js";
import { getSocketPrettyName } from "../../util/shared";
import { getRoomIdFromName, getSocketsInRoom } from "../../util/roomUtils";
import { GameController } from "./gameController";
const logger = log4js.getLogger();






@SocketController()
@Service()
export class RoomController {

    constructor(
        private gameController: GameController
    ) {}

    @OnMessage(ROOM_EVENTS.JOIN_ROOM)
    public async joinGame(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: { roomName: string } // TODO: need an interface here
    ) {

        const roomId = getRoomIdFromName(message.roomName);
        const socketsInRoom = await getSocketsInRoom(io, roomId);

        logger.info(chalk.cyan("Request join room:  ", getSocketPrettyName(socket), roomId + ": " + (socketsInRoom.length || 0)));

        
        // This needs to be an atomic check here.
        if (socketsInRoom.length === ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS) {
            console.log("Could not join room.  Max size already hit.");
            logger.info(chalk.red("Room join failure:  ", getSocketPrettyName(socket), roomId + ": " + (socketsInRoom.length || 0)));

            socket.emit(ROOM_EVENTS.JOIN_ROOM_ERROR, {
                error: "Room is full please choose another room to play!",
            });
        } else {
            try {
                await socket.join(roomId);

                const updatedSocketsInRoom = await getSocketsInRoom(io, roomId);

                console.log(roomId);
                socket.emit(ROOM_EVENTS.JOIN_ROOM_SUCCESS, { roomId });

                logger.info(chalk.cyan(
                    "Room join success:  ",
                    getSocketPrettyName(socket),
                    roomId + ": " + (updatedSocketsInRoom.length || 0),
                    updatedSocketsInRoom.length === ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS ? "[MAX]" : ""
                ));

                if (updatedSocketsInRoom.length === ROOM_CONSTANTS.ROOM_NUMBER_OF_PLAYERS_TO_START) {
                    this.onRoomReady(io, roomId);
                }
            }
            catch (e) {
                console.log("There was an error!", e);
            }
        }
    }

    private async onRoomReady(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomId: string) {      

        const socketsInRoom = io.sockets.adapter.rooms.get(roomId) || new Set<string>();
        const socketsInRoomStr = Array.from(socketsInRoom).join(", ");

        logger.info(chalk.cyan("Room at max players:", roomId + ":", "[" + socketsInRoomStr + "]"));
        
        io.to(roomId).timeout(5000).emit(ROOM_EVENTS.ROOM_READY, { roomId }, async (err: any, responses: string[]) => {
            if (err) {
                console.log("Clients did not all reply in 5000ms");
            } else {
                if (responses.filter(r => r === "ACK").length === responses.length) {

                    this.gameController.startGame(io, roomId);

                    // logger.info(chalk.cyan("Starting game:      ", roomName + ":", "[" + socketsInRoomStr + "]"));
                    // const sockets = await io.in(roomName).fetchSockets();
                    // sockets[0].emit(GAME_EVENTS.START_GAME, { start: true, player: 1 } );
                    // sockets[1].emit(GAME_EVENTS.START_GAME, { start: true, player: 2 } );
                }
                else {
                    console.log("Not all clients responded with ACK");
                }
            }
          });

    }
    
    // private async roomReady(socket: Socket, roomName: string) {       
    //     console.log("Emitting from socket [" + socket.id + "] [" + ROOM_EVENTS.ROOM_READY + "] to room [" + roomName + "]"); 
    //     socket
    //         .to(roomName)
    //         .emit(ROOM_EVENTS.ROOM_READY);

    //     console.log("Emitting to socket [" + socket.id + "] [" + ROOM_EVENTS.ROOM_READY + "]"); 

    //     socket.emit(ROOM_EVENTS.ROOM_READY);

    //     console.log("Room is joined and waiting on both clients to confirm!");
    // }
}
