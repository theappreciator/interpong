import { Server, Socket } from "socket.io";
import { RoomState } from ".";
import { RoomController } from "../roomController";



class AtMaxPlayerState implements RoomState {

    protected _roomController: RoomController;

    constructor(roomController: RoomController) {
        this._roomController = roomController;
    }

    async playerJoining(roomId: string, io: Server, socket: Socket): Promise<void> {
        this._roomController.alertRoomAtMax(roomId, io, socket)
        .then(() => {
            return Promise.resolve();
        })
    }   

    playerLeft(roomId: string, io: Server, socket: Socket): Promise<void> {
        return Promise.resolve();
    }
}

export default AtMaxPlayerState;