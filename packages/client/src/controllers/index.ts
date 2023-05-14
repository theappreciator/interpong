import { IRoomState } from "@interpong/common";
import { IGameService, INetworkServiceConsumer, IRoomService } from "../services";
import SocketGameRoomController from "./SocketGameRoomController";
import GamePageController from "./GamePageController";



export interface IGameController<T> extends IGameService<T> {

}

export interface IRoomController<T> extends IRoomService<T> {
    joinGameRoom(roomName: string): Promise<string>;
    leaveGameRoom(roomName: string): Promise<void>;

    listGameRooms(): Promise<string[]>;
    listUsersInGameRoom(roomName: string): Promise<string[]>;
}

export interface IGameRoomController<T> extends IRoomController<T>, IGameController<T>, INetworkServiceConsumer {
    onAdmin(listener: (roomStates: IRoomState[]) => void): void;
};


export {
    SocketGameRoomController,
    GamePageController
}