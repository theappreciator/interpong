import { Server, Socket } from "socket.io";
import { AtMaxPlayerState, RoomState } from ".";
import { RoomController } from "../roomController";



class HasMinPlayerState implements RoomState {
    
    protected _roomController: RoomController;

    constructor(roomController: RoomController) {
        this._roomController = roomController;
    }

    async playerJoining(roomId: string, io: Server, socket: Socket): Promise<void> {
        this._roomController.joinRoom(roomId, io, socket);
        this._roomController.notifyRoomAlreadyReady(roomId, io, socket);

        const isAtMax = await this._roomController.isRoomAtMax(roomId, io, socket);
        if (isAtMax) {
            const state = new AtMaxPlayerState(this._roomController);
            this._roomController.setRoomStateforRoom(roomId, state);
        }
    }   

    playerLeft(roomId: string, io: Server, socket: Socket): Promise<void> {
        return Promise.resolve();
    }
}

export default HasMinPlayerState;