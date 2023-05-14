import { IStartGame } from "../types";
import { mockGameRoomState } from "./MockGameRoomState";
import { mockPlayer1 } from "./MockPlayerState";

const mockStartGame: IStartGame = {
    start: true,
    player: mockPlayer1,
    state: mockGameRoomState
};

export {
    mockStartGame
}