import {
    ConnectedSocket,
    MessageBody,
    OnDisconnect,
    OnMessage,
    SocketController,
    SocketIO,
} from "socket-controllers";
import {Service} from 'typedi';
import { Namespace, Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { GAME_EVENTS, IPlayerState, IRoomState, ROOM_CONSTANTS, ROOM_EVENTS } from "@interpong/common";
import chalk from "chalk";
import * as log4js from "log4js";
import { getRoomsPrettyName, getSocketPrettyName } from "../../util/shared";
import { getRoomIdFromName, getSocketsInRoom } from "../../util/roomUtils";
import { GameController } from "./gameController";
import GameRoomStateService from "../../services/gameRoomStateService";
import { AtMaxPlayerState, HasMinPlayerState, NotEnoughPlayersState, RoomState } from "./RoomStates";
const logger = log4js.getLogger();



@SocketController()
@Service()
export class RoomController {

    private _roomStates: Map<string, RoomState>;

    constructor(
        private gameController: GameController
    ) {
        this._roomStates = new Map<string, RoomState>();
    }

    /*******************************************/
    /* Socket Server events                    */
    /*******************************************/

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

        let state = this._roomStates.get(roomId) || this.createRoom(roomId);
        
        state.playerJoining(roomId, io, socket);
    }

    @OnDisconnect()
    public onDisconnect(
      @ConnectedSocket() socket: Socket,
      @SocketIO() io: Server
    ) {
        // TODO: create Room specific onDisconnect logic

        logger.info(chalk.red("Socket Disconnected:", getSocketPrettyName(socket)));

        // TODO: consider changing this to deletePlayerFromRooms, since we can get the room they are connected to straight from the socket
        // - but, can we rely on that?  Is it possible that socket.rooms is out of sync from our data in PersistService?
        GameRoomStateService.deletePlayer(socket.id);
    
        logger.info(chalk.blue("Available Rooms:    ", getRoomsPrettyName(io.sockets.adapter.rooms)));
    }

    /*******************************************/
    /* internal helpers                        */
    /*******************************************/

    private createRoom(roomId: string): NotEnoughPlayersState {

        logger.info(chalk.cyan(`Creating room:      ${roomId}`));

        const startingState = new NotEnoughPlayersState(this);
        this._roomStates.set(roomId, startingState);

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

        if (socketsInRoom.length === ROOM_CONSTANTS.ROOM_NUMBER_OF_PLAYERS_TO_START) {
            return true;
        }

        return false;
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

        logger.info(chalk.cyan("Room ready to start:", roomId + ":", "[" + socketsInRoomStr + "]"));
        
        const roomState: IRoomState = {
            roomId: roomId,
            numberOfPlayers: socketsInRoom.size,
            maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
        };
        
        io.to(roomId).timeout(5000).emit(ROOM_EVENTS.ROOM_READY, roomState, async (err: any, responses: string[]) => {
            if (err) {
                logger.info(chalk.red (`Game start error:    ${roomId}: Clients did not all reply in 5000ms`));
            } else {
                if (responses.filter(r => r === "ACK").length === responses.length) {
                    this.gameController.startGame(io, roomId);
                }
                else {
                    logger.info(chalk.red (`Game start error:    ${roomId}: Not all clients responded with ACK`));
                }
            }
        });
    }

    public async notifyRoomAlreadyReady(roomId: string, io: Server, socket: Socket): Promise<void> {
        // TODO: need a method exposted on room controller to allow a new player to join an already running game
        //this.onRoomReady(io, roomId);
    }

    public async joinRoom(roomId: string, io: Server, socket: Socket): Promise<void> {
        try {
            await socket.join(roomId);

            const socketsInRoom = await getSocketsInRoom(io, roomId);

            const gameRoomStateService = new GameRoomStateService(roomId);
            // TODO what happens if a socket id is already in the state? (IE, a user sends a room join event more than once)
            const playerState = gameRoomStateService.addPlayer(socket.id);

            const roomState: IRoomState = {
                roomId: roomId,
                numberOfPlayers: socketsInRoom.length,
                maxNumberOfPlayers: ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS
            }

            socket.emit(ROOM_EVENTS.JOIN_ROOM_SUCCESS, roomState);

            logger.info(chalk.cyan(
                "Room join success:  ",
                getSocketPrettyName(socket),
                `${roomId}: ${playerState.playerNumber}/${socketsInRoom.length || 0}`,
                socketsInRoom.length === ROOM_CONSTANTS.ROOM_MAX_NUMBER_OF_PLAYERS ? "[MAX]" : ""
            ));
        }
        catch (e) {
            console.log("There was an error!", e);
        }
    }

    public setRoomStateforRoom(roomId: string, roomState: RoomState) {
        this._roomStates.set(roomId, roomState);
    }

    public getRoomStateForRoom(roomId: string) {
        return this._roomStates.get(roomId);
    }

}
