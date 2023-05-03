import { Server, Socket } from "socket.io";
import { HasMinPlayerState, NotEnoughPlayersState, RoomState } from ".";
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

    async playerLeft(roomId: string, io: Server, socket: Socket): Promise<void> {
        this._roomController.leaveRoom(roomId, io, socket);

        const isAtMax = await this._roomController.isRoomAtMax(roomId, io, socket);
        if (!isAtMax) {
            const hasEnoughToStart = await this._roomController.isRoomReadyToStart(roomId, io, socket);
            if (hasEnoughToStart) {
                const state = new HasMinPlayerState(this._roomController);
                this._roomController.setRoomStateforRoom(roomId, state);
            }
            else {
                const state = new NotEnoughPlayersState(this._roomController);
                this._roomController.setRoomStateforRoom(roomId, state);
    
                // TODO: do we notify an ongoing room that we have players, just the count is below the min to start?
            }
        }
    }
}

export default AtMaxPlayerState;