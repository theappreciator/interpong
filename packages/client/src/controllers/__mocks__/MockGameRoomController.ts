import { IStartGame, IPlayData, IGameRoomState, IScoreData, IPlayerState, GAME_SCORE_EVENT_POINTS, GameStateStatus } from "@interpong/common";
import { IGameRoomController } from "..";


class MockGameRoomController implements IGameRoomController<string> {

    private _onConnected: (s: string) => void = (s) => { console.log("Default MockGameRoomController onConnected") };
    private _onReConnected: (s: string) => void = (socket) => { console.log("Default MockGameRoomController onReConnected") };
	private _onDisconnected: (message: string) => void = () => { console.log("Default MockGameRoomController onDisconnected")};
    private _onDisconnectedFromRoom: (roomId: string) => void = () => {};
    private _onRoomReadyToStartGame: (roomId: string) => void = () => {};
    private _onPing: () => void = () => {};
    private _onPong: () => void = () => {};
    private _onStartGame: (options: IStartGame) => void = (options) => {console.log("Default MockGameRoomController onStartGame", options)};
    private _onGameFocusEnter: (playData: IPlayData) => void = (playData) => {console.log("Default MockGameRoomController onGameFocusEnter", playData)};
    private _onGameScoreChange: (gameRoomState: IGameRoomState) => void = (gameRoomState) => {console.log("Default ScoketGameRoomController onGameScoreChange", gameRoomState)};


    constructor() {

    }

    joinGameRoom(roomName: string): Promise<string> {
        return Promise.resolve("joinGameRoom");
    }
    leaveGameRoom(roomName: string): Promise<void> {
        return Promise.resolve();
    }
    listGameRooms(): Promise<string[]> {
        return Promise.resolve([]);
    }
    listUsersInGameRoom(roomName: string): Promise<string[]> {
        return Promise.resolve([]);
    }
    onDisconnectedFromRoom(listener: (roomId: string) => void): void {
        this._onDisconnectedFromRoom = listener;
    }
    onRoomReadyToStartGame(listener: (roomId: string) => void): void {
        this._onRoomReadyToStartGame = listener;
    }
    onStartGame(listener: (options: IStartGame) => void): void {
        this._onStartGame = listener;
    }
    onGameFocusEnter(listener: (playData: IPlayData) => void): void {
        this._onGameFocusEnter = listener;
    }
    doGameFocusLeave(playData: IPlayData): void {
        return;
    }
    onGameScoreChange(listener: (gameRoomState: IGameRoomState) => void): void {
        this._onGameScoreChange = listener;
    }
    doGameScoreChange(scoreData: IScoreData): void {
        const player1: IPlayerState = {
            id: "ABCD",
            player: 1,
            score: scoreData.currentScore + GAME_SCORE_EVENT_POINTS[scoreData.event]
        };
        const player2: IPlayerState = {
            id: "ZYXW",
            player: 2,
            score: 5000
        };
        const players: IPlayerState[] = [];
        players.push(player1);
        players.push(player2);
        const gameRoomState: IGameRoomState = {
            players: players,
            game: {
                currentPlayer: 1,
                status: GameStateStatus.GAME_STARTED
            }
        }
        this._onGameScoreChange(gameRoomState);
    }
    onGameCompleted(listener: () => void): void {
        this._onGameFocusEnter = listener;
    }
    connect(): void {
        return;
    }
    onConnected(listener: () => void): void {
        this._onConnected = listener;
    }
    onReConnected(listener: () => void): void {
        this._onReConnected = listener;
    }
    onDisconnected(listener: (message: string) => void): void {
        this._onDisconnected = listener;
    }
    doPing(): void {
        return;
    }
    onPing(listener: () => void): void {
        this._onPing = listener;
    }
    onPong(listener: () => void): void {
        this._onPong = listener;
    }

}

export default MockGameRoomController;
