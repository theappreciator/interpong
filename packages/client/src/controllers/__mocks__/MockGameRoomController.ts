import { IStartGame, IPlayData, IGameRoomState, IScoreData, IPlayerState, GAME_SCORE_EVENT_POINTS, GameStateStatus, ROOM_CONSTANTS, IRoomState, IBallState, getRandomMockBall } from "@interpong/common";
import { IGameRoomController } from "..";
import { Player } from "../../sprites";


class MockGameRoomController implements IGameRoomController<string> {

    private _onConnected: (s: string) => void = (s) => { console.log("Default MockGameRoomController onConnected") };
    private _onReConnected: (s: string) => void = (socket) => { console.log("Default MockGameRoomController onReConnected") };
	private _onDisconnected: (message: string) => void = () => { console.log("Default MockGameRoomController onDisconnected")};
    private _onRoomsUpdate: (roomStates: IRoomState[]) => void = (roomStates) => {console.log("Default MockGameRoomController onRoomUpdate", roomStates)};
    private _onDisconnectedFromRoom: (roomId: string) => void = () => {};
    private _onRoomReadyToStartGame: (roomState: IRoomState) => void = (roomState) => {console.log("Default MockGameRoomController onRoomReadyToStartGame")};
    private _onPing: () => void = () => {};
    private _onPong: () => void = () => {};
    private _onStartGame: (options: IStartGame) => void = (options) => {console.log("Default MockGameRoomController onStartGame", options)};
    private _onGameBallEnterBoard: (ball: IBallState) => void = (ball) => {console.log("Default MockGameRoomController onGameBallEnterBoard", ball)};
    private _onGameScoreChange: (gameRoomState: IGameRoomState) => void = (gameRoomState) => {console.log("Default ScoketGameRoomController onGameScoreChange", gameRoomState)};


    constructor() {

    }

    /* Mocking methods */

    makeTestBall() {
        const ball = getRandomMockBall(1);
        this._onGameBallEnterBoard(ball);
    }

    /* Mocked up interface methods */

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
    doGetRooms(): void {
        const room1: IRoomState = {
            roomId: ROOM_CONSTANTS.ROOM_IDENTIFIER + "mario",
            numberOfPlayers: 1,
            maxNumberOfPlayers: 2
        }
        const room2: IRoomState = {
            roomId: ROOM_CONSTANTS.ROOM_IDENTIFIER + "luigi",
            numberOfPlayers: 2,
            maxNumberOfPlayers: 2
        }
        const rooms = [];
        rooms.push(room1);
        rooms.push(room2);
        this._onRoomsUpdate(rooms);
    }
    onRoomsUpdate(listener: (roomStates: IRoomState[]) => void): void {
        this._onRoomsUpdate = listener;
    }
    onDisconnectedFromRoom(listener: (roomId: string) => void): void {
        this._onDisconnectedFromRoom = listener;
    }
    onRoomReadyToStartGame(listener: (roomState: IRoomState) => void): void {
        this._onRoomReadyToStartGame = listener;
    }
    onStartGame(listener: (options: IStartGame) => void): void {
        this._onStartGame = listener;
    }
    onGameBallEnterBoard(listener: (ball: IBallState) => void) {
        this._onGameBallEnterBoard = listener;
    }
    doGameBallLeaveBoard(ball: IBallState) {
        return;
    }
    onGameScoreChange(listener: (gameRoomState: IGameRoomState) => void): void {
        this._onGameScoreChange = listener;
    }
    doGameScoreChange(scoreData: IScoreData): void {
        const player1: IPlayerState = {
            id: "ABCD",
            playerNumber: 1,
            team: "left",
            score: scoreData.currentScore + GAME_SCORE_EVENT_POINTS[scoreData.event]
        };
        const player2: IPlayerState = {
            id: "ZYXW",
            playerNumber: 2,
            team: "right",
            score: 50
        };
        const players: IPlayerState[] = [];
        players.push(player1);
        players.push(player2);
        const gameRoomState: IGameRoomState = {
            players: players,
            game: {
                status: GameStateStatus.GAME_STARTED
            },
            balls: [] // TODO: this needs somthing dummied in
        }
        this._onGameScoreChange(gameRoomState);
    }
    onGameCompleted(listener: () => void): void {
        throw new Error("Method not implemented.");
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
