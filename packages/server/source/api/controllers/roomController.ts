import {
    ConnectedSocket,
    MessageBody,
    OnDisconnect,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import {Service} from 'typedi';
import { Server, Socket } from "socket.io";
import { IGameRoomState, IRoomState, ROOM_CONSTANTS, ROOM_EVENTS } from "@interpong/common";
import chalk from "chalk";
import * as log4js from "log4js";
import { getSocketPrettyName } from "../../util/shared";
import { getRoomIdFromName, getSocketsInRoom, isRoomId } from "../../util/roomUtils";
import { NotEnoughPlayersState, RoomState } from "./RoomStates";
import SocketGameService from "../../services/socketGameService";
import { PersistService } from "../../services";
const logger = log4js.getLogger();



const CONTROLLER_KEY = "ROOM_CONTROLLER|";

@SocketController()
@Service()
export class RoomController {

    private _persist: PersistService<RoomState>;

    // private _roomStates: Map<string, RoomState>;

    constructor(
    ) {
        // this._roomStates = new Map<string, RoomState>();

        this._persist = PersistService.Instance;
    }

    /*******************************************/
    /* Socket Server events                    */
    /*******************************************/

    @OnMessage(ROOM_EVENTS.ROOMS_UPDATE)
    public async roomsUpdate(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket
    ) {
        logger.info(chalk.white("Request list rooms: ", getSocketPrettyName(socket)));

        const roomStates: IRoomState[] = [];
        for (const [roomId, sockets] of io.sockets.adapter.rooms.entries()) {
            // TODO: this logic to get only rooms matching ROOM| needs to be in a utility
            if (isRoomId(roomId)) {
                const room: IRoomState = {
                    roomId: roomId,
                    numberOfPlayers: sockets.size,
                    maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
                }
                roomStates.push(room);
            }
        }

        logger.info(chalk.white("Sending list rooms: ", roomStates.map(r => r.roomId + "-" + r.numberOfPlayers + "/" + r.maxNumberOfPlayers)));

        socket.emit(ROOM_EVENTS.ON_ROOMS_UPDATE, roomStates);
    }

    @OnMessage(ROOM_EVENTS.JOIN_ROOM)
    public async joinGame(
        @SocketIO() io: Server,
        @ConnectedSocket() socket: Socket,
        @MessageBody() message: { roomName: string } // TODO: need an interface here
    ) {
        // if (message.roomName === "ADMIN") {
        //     const roomStates: IRoomState[] = [];
        //     for (const [roomId, sockets] of io.sockets.adapter.rooms.entries()) {
        //         // TODO: this logic to get only rooms matching ROOM| needs to be in a utility
        //         if (roomId.toUpperCase().startsWith(ROOM_CONSTANTS.ROOM_IDENTIFIER.toUpperCase())) {
        //             const room: IRoomState = {
        //                 roomId: roomId,
        //                 numberOfPlayers: sockets.size,
        //                 maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
        //             }
        //             roomStates.push(room);
        //         }
        //     }
    
        //     socket.emit("ADMIN_START", roomStates);
        // }
        // else {

        try {
            const roomId = getRoomIdFromName(message.roomName);

            const socketsInRoom = await getSocketsInRoom(io, roomId);

            logger.info(chalk.white("Request join room:  ", getSocketPrettyName(socket), roomId + ": " + (socketsInRoom.length || 0)));

            let state = this._persist.retrieve(CONTROLLER_KEY + roomId) || this.createRoom(roomId);

            state.playerJoining(roomId, io, socket);
        } catch (e: unknown) {
            logger.error("Error in joinGame()", e);
        }
        // }
    }

    @OnDisconnect()
    public onDisconnect(
      @ConnectedSocket() socket: Socket,
      @SocketIO() io: Server
    ) {
        try {
            const socketGameService = new SocketGameService();
            const roomId = socketGameService.getRoomFromSocket(socket);

            logger.info(chalk.red("Socket Disconnected:", getSocketPrettyName(socket), roomId));

            if (roomId) {
                let state = this._persist.retrieve(CONTROLLER_KEY + roomId);
                if (state) {
                    state.playerLeft(roomId, io, socket);
                }
            }
        } catch (e: unknown) {
            logger.error("Error in onDisconnect()", e);
        }
    }

    /*******************************************/
    /* internal helpers                        */
    /*******************************************/

    private createRoom(roomId: string): NotEnoughPlayersState {

        logger.info(chalk.white(`Creating room:      ${roomId}`));

        const startingState = new NotEnoughPlayersState(this);
        this._persist.save(CONTROLLER_KEY + roomId, startingState);

        return startingState;
    }

    /*******************************************/
    /* public methods for states to controller */
    /*******************************************/

    public async isRoomAtMax(roomId: string, io: Server, socket: Socket): Promise<boolean> {
        const socketsInRoom = await getSocketsInRoom(io, roomId);

        if (socketsInRoom.length === ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS) {
            return true;
        }

        return false;
    }

    public async isRoomReadyToStart(roomId: string, io: Server, socket: Socket): Promise<boolean> {
        const socketsInRoom = await getSocketsInRoom(io, roomId);

        if (socketsInRoom.length >= ROOM_CONSTANTS.ROOM_NUMBER_OF_PLAYERS_TO_START) {
            return true;
        }
        else {
            return false;
        }
    }

    public async alertRoomAtMax(roomId: string, io: Server, socket: Socket): Promise<void> {
        logger.info(chalk.red(`Room join failure:  ${getSocketPrettyName(socket)} ${roomId}`));

        socket.emit(ROOM_EVENTS.JOIN_ROOM_ERROR, {
            error: "Room is full please choose another room to play!",
        });
    }

    public async notifyRoomReady(roomId: string, io: Server, socket: Socket): Promise<void> {
        const socketsInRoom = io.sockets.adapter.rooms.get(roomId) || new Set<string>();
        const socketsInRoomStr = Array.from(socketsInRoom).join(", ");

        logger.info(chalk.white("Room ready to start:", roomId + ":", "[" + socketsInRoomStr + "]"));
        
        const roomState: IRoomState = {
            roomId: roomId,
            numberOfPlayers: socketsInRoom.size,
            maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
        };
        
        io.to(roomId).timeout(5000).emit(ROOM_EVENTS.ROOM_READY, roomState, async (err: any, responses: string[]) => {
            if (err) {
                logger.info(chalk.red (`Game start error:    ${roomId}: Clients did not all reply in 5000ms`, err));
            } else {
                if (responses.filter(r => r === "ACK").length === responses.length) {
                    const socketGameService = new SocketGameService();
                    socketGameService.startGame(io, roomId);
                }
                else {
                    logger.info(chalk.red (`Game start error:    ${roomId}: Not all clients responded with ACK`));
                }
            }
        });
    }

    public async notifyRoomAlreadyReady(roomId: string, io: Server, socket: Socket): Promise<void> {
        const socketsInRoom = io.sockets.adapter.rooms.get(roomId) || new Set<string>();
        const socketsInRoomStr = Array.from(socketsInRoom).join(", ");

        logger.info(chalk.white("Joining in progress:", roomId + ":", "[" + socketsInRoomStr + "]"));

        const roomState: IRoomState = {
            roomId: roomId,
            numberOfPlayers: socketsInRoom.size,
            maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
        };

        socket.emit(ROOM_EVENTS.ROOM_READY, roomState, async (response: string) => {
            if (response === "ACK") {
                const socketGameService = new SocketGameService();
                socketGameService.startGameInProgressForPlayer(io, socket, roomId);
            }
            else {
                logger.info(chalk.red (`Game join error:     ${roomId}: Not all clients responded with ACK`));
            }
        });
    }

    public async joinRoom(roomId: string, io: Server, socket: Socket): Promise<void> {
        try {
            await socket.join(roomId);

            // TODO what happens if a socket id is already in the state? (IE, a user sends a room join event more than once)
            const socketGameService = new SocketGameService();
            const playerState = socketGameService.addPlayer(roomId, socket);

            const socketsInRoom = await getSocketsInRoom(io, roomId);

            const roomState: IRoomState = {
                roomId: roomId,
                numberOfPlayers: socketsInRoom.length,
                maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
            }

            socket.emit(ROOM_EVENTS.JOIN_ROOM_SUCCESS, roomState);

            logger.info(chalk.white(
                "Room join success:  ",
                getSocketPrettyName(socket),
                `${roomId}: ${socketsInRoom.length || 0}/${ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS}`,
                socketsInRoom.length === ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS ? "[MAX]" : ""
            ));
        }
        catch (e) {
            logger.info(chalk.red(`There was an error`, e));
        }
    }

    public leaveRoom(roomId: string, io: Server, socket: Socket): Promise<void> {
        const socketGameService = new SocketGameService();
        socketGameService.removePlayer(io, socket, roomId, (gameRoomState?: IGameRoomState) => {
            if (!gameRoomState) {
                this._persist.delete(CONTROLLER_KEY + roomId);
            }
        });

        return Promise.resolve();
    }

    public setRoomStateforRoom(roomId: string, roomState: RoomState) {
        this._persist.save(CONTROLLER_KEY + roomId, roomState);
    }

    public getRoomStateForRoom(roomId: string) {
        return this._persist.retrieve(CONTROLLER_KEY + roomId);
    }

}
