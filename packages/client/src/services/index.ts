import { IGameRoomState, IRoomState, IScoreData } from "@interpong/common";
import { IPlayData, IStartGame } from "@interpong/common";
import SocketService from "./socketService";

export interface IGameService<T> {
    onStartGame(listener: (options: IStartGame) => void): void;

    onGameFocusEnter(listener: (playData: IPlayData) => void): void;
    doGameFocusLeave(playData: IPlayData): void;
    onGameScoreChange(listener: (gameRoomState: IGameRoomState) => void): void;
    doGameScoreChange(scoreData: IScoreData): void

    onGameCompleted(listener: () => void): void;
}

export interface IRoomService<T> {
    doGetRooms(): void;
    onRoomsUpdate(listener: (roomStates: IRoomState[]) => void): void;
    onDisconnectedFromRoom(listener: (roomId: string) => void): void;
    onRoomReadyToStartGame(listener: (roomStates: IRoomState) => void): void;
}

export interface INetworkServiceConsumer {
    connect(): void;
    onConnected(listener: () => void): void;
    onReConnected(listener: () => void): void;
    onDisconnected(listener: (message: string) => void): void;
    doPing(): void;
    onPing(listener: () => void): void;
    onPong(listener: () => void): void;
}

export interface INetworkService<T> {
    createConnector(url: string): Promise<T>;
    onReConnected(listener: (connector: T) => void): void;
    onDisconnected(listener: (message: string) => void): void;
    doPing(connector: T): void;
    onPing(listener: () => void): void;
    onPong(listener: () => void): void;
}

export {
    SocketService
}