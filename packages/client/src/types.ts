// Shared types
export type Vector = {
    x: number;
    y: number;
};

export interface IStartGame {
    start: boolean;
    player: 1 | 2;
}

export interface IPlayData {
    position: Vector,
    direction: Vector
}

export interface IGameRoomReturn {
    roomId: string
}