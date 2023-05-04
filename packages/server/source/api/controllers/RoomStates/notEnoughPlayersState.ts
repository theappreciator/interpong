import { Server, Socket } from "socket.io";
import { AtMaxPlayerState, HasMinPlayerState, RoomState } from ".";
import { RoomController } from "..";



class NotEnoughPlayersState implements RoomState {

    protected _roomController: RoomController;

    constructor(roomController: RoomController) {
        this._roomController = roomController;
    }

    async playerJoining(roomId: string, io: Server, socket: Socket): Promise<void> {
        this._roomController.joinRoom(roomId, io, socket);

        const hasEnoughToStart = await this._roomController.isRoomReadyToStart(roomId, io, socket);
        if (hasEnoughToStart) {
            const state = new HasMinPlayerState(this._roomController);
            this._roomController.setRoomStateforRoom(roomId, state);

            this._roomController.notifyRoomReady(roomId, io, socket);
        }

        const isAtMax = await this._roomController.isRoomAtMax(roomId, io, socket);
        if (isAtMax) {
            const state = new AtMaxPlayerState(this._roomController);
            this._roomController.setRoomStateforRoom(roomId, state);
        }
    }   

    async playerLeft(roomId: string, io: Server, socket: Socket): Promise<void> {
        this._roomController.leaveRoom(roomId, io, socket);

        const isAtMax = await this._roomController.isRoomAtMax(roomId, io, socket);
        if (isAtMax) {
            const state = new AtMaxPlayerState(this._roomController);
            this._roomController.setRoomStateforRoom(roomId, state);
        }
        else {
            const hasEnoughToStart = await this._roomController.isRoomReadyToStart(roomId, io, socket);
            if (!hasEnoughToStart) {
                const state = new NotEnoughPlayersState(this._roomController);
                this._roomController.setRoomStateforRoom(roomId, state);

                // TODO: do we notify an ongoing room that we have players, just the count is below the min to start?
            }
        }
    }
}

export default NotEnoughPlayersState;