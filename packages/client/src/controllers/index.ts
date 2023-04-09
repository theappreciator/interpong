import { IGameService, INetworkServiceConsumer, IRoomService } from "../services";
import SocketGameRoomController from "./SocketGameRoomController";



export interface IGameController<T> extends IGameService<T> {

}

export interface IRoomController<T> extends IRoomService<T> {
    joinGameRoom(roomName: string): Promise<string>;
    leaveGameRoom(roomName: string): Promise<void>;

    listGameRooms(): Promise<string[]>;
    listUsersInGameRoom(roomName: string): Promise<string[]>;
}

export interface IGameRoomController<T> extends IRoomController<T>, IGameController<T>, INetworkServiceConsumer {};


export {
    SocketGameRoomController
}