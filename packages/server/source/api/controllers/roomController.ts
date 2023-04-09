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
import { GAME_EVENTS, IRoomState, ROOM_CONSTANTS, ROOM_EVENTS } from "@interpong/common";
import chalk from "chalk";
import * as log4js from "log4js";
import { getSocketPrettyName } from "../../util/shared";
import { getRoomIdFromName, getSocketsInRoom } from "../../util/roomUtils";
import { GameController } from "./gameController";
import GameRoomStateService from "../../services/gameRoomStateService";
const logger = log4js.getLogger();



@SocketController()
@Service()
export class RoomController {

    constructor(
        private gameController: GameController
    ) {}

    @OnMessage(ROOM_EVENTS.ROOMS_UPDATE)
    public async roomsUpdate(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket
    ) {
        logger.info(chalk.cyan("Request list rooms: ", getSocketPrettyName(socket)));

        const roomStates: IRoomState[] = [];
        for (const [roomId, sockets] of io.sockets.adapter.rooms.entries()) {
            // TODO: this logic to get only rooms matching ROOM| needs to be in a utility
            if (roomId.toUpperCase().startsWith(ROOM_CONSTANTS.ROOM_IDENTIFIER.toUpperCase())) {
                const room: IRoomState = {
                    roomId: roomId,
                    numberOfPlayers: sockets.size,
                    maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
                }
                roomStates.push(room);
            }
        }

        socket.emit(ROOM_EVENTS.ON_ROOMS_UPDATE, roomStates);
    }

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

                const gameRoomStateService = new GameRoomStateService(roomId);
                // TODO: How is this working alongside the gameController->startGame() method?
                const playerState = gameRoomStateService.addPlayer(socket.id);

                const roomState: IRoomState = {
                    roomId: roomId,
                    numberOfPlayers: updatedSocketsInRoom.length,
                    maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
                }

                socket.emit(ROOM_EVENTS.JOIN_ROOM_SUCCESS, roomState);

                logger.info(chalk.cyan(
                    "Room join success:  ",
                    getSocketPrettyName(socket),
                    `${roomId}: ${playerState.playerNumber}/${updatedSocketsInRoom.length || 0}`,
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
        
        const roomState: IRoomState = {
            roomId: roomId,
            numberOfPlayers: socketsInRoom.size,
            maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
        };
        
        io.to(roomId).timeout(5000).emit(ROOM_EVENTS.ROOM_READY, roomState, async (err: any, responses: string[]) => {
            if (err) {
                console.log("Clients did not all reply in 5000ms");
            } else {
                if (responses.filter(r => r === "ACK").length === responses.length) {
                    this.gameController.startGame(io, roomId);
                }
                else {
                    console.log("Not all clients responded with ACK");
                }
            }
          });

    }
    
}
