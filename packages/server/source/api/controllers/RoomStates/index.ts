import NotEnoughPlayersState from "./notEnoughPlayersState";
import HasMinPlayerState from "./hasMinPlayerState";
import AtMaxPlayerState from "./atMaxPlayerState";
import { Server, Socket } from "socket.io";



interface RoomState {
    playerJoining(roomId: string, io: Server, socket: Socket): Promise<void>;
    playerLeft(roomId: string, io: Server, socket: Socket): Promise<void>;
}

export {
    RoomState,
    NotEnoughPlayersState,
    HasMinPlayerState,
    AtMaxPlayerState
}