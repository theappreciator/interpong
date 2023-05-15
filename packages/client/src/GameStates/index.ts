import WaitingToConnectGameState from "./waitingToConnectGameState";
import SelectingRoomGameState from "./selectingRoomGameState";
import WaitingInRoomGameState from "./waitingInRoomGameState";
import PlayingGameState from "./playingGameState";
import { IBallState, IGameRoomState, IRoomState, IStartGame } from "@interpong/common";



type GameStateType = "waiting_connect" | "game_room_selector" | "game_room_waiting" | "game_ready" | "game_room_admin";

interface IGameState {
    type: GameStateType;

    handleStartingUp(): void;
    handleConnectedToServer(): void;
    handleDisconnectedFromServer(wasConnected: boolean, e: any): void;
    handleReconnectedToServer(): void;

    handleRoomListUpdate(roomStates: IRoomState[]): void;
    handleJoiningRoom(roomName: string | undefined): void;
    handleRoomReadyToStartGame(roomState: IRoomState): void;
    handleDisconnectingFromRoom() :void;

    handleStartGame(startGameData: IStartGame): void;
    handleEndingGame(): void;
    handleGameBallEnteredBoard(ball: IBallState): void;
    handleGameRoomStateChange(gameRoomState: IGameRoomState): void;
}

export {
    GameStateType,
    IGameState,
    WaitingToConnectGameState,
    SelectingRoomGameState,
    WaitingInRoomGameState,
    PlayingGameState
}