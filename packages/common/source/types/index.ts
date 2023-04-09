export enum SOCKET_EVENTS {
    PING = "ping",
    PONG = "pong"
}

export enum GAME_EVENTS {
    START_GAME = "start_game",
    // ON_START_GAME = "on_start_game",
    READY_FOR_GAME = "ready_for_game",
    // ON_READY_FOR_GAME = "on_ready_for_game",
    UPDATE_GAME = "update_game", // the outgoing event from client->server
    ON_UPDATE_GAME = "on_update_game", // the incoming event from server->client. 
    UPDATE_SCORE = "update_score", // the outgoing event from the client->server
    ON_UPDATE_SCORE = "on_update_score", // the incoming event from server->client
    WIN_GAME = "win_game",
    ON_WIN_GAME = "on_win_game",
}

export enum GAME_SCORE_EVENTS {
    WALL_HIT = "WALL_HIT"
}

export enum GAME_SCORE_EVENT_POINTS {
    WALL_HIT = 10
}

export const GAME_CONSTANTS = {
    
}

export enum ROOM_EVENTS {
    JOIN_ROOM = "join_room",
    // ON_JOIN_GAME = "on_join_game",
    JOIN_ROOM_ERROR = "join_room_error",
    JOIN_ROOM_SUCCESS = "join_room_success",
    ROOM_READY = "room_ready",
    ROOM_DISCONNECT = "room_disconnect",
    ROOMS_UPDATE = "rooms_update",
    ON_ROOMS_UPDATE = "on_rooms_update"
}

export const ROOM_CONSTANTS = {
    ROOM_IDENTIFIER: "ROOM|",
    ROOM_NUMBER_OF_PLAYERS_TO_START: 2,
    ROOM_MAX_NUMBER_OF_PLAYERS: 2
}

// Shared types
export type Vector = {
    x: number;
    y: number;
};

export interface IStartGame {
    start: boolean;
    player: IPlayerState,
    enterBall: boolean;
    state: IGameRoomState
}

export interface IPlayData {
    position: Vector,
    direction: Vector
}

export interface IScoreData {
    player: number,
    currentScore: number,
    event: GAME_SCORE_EVENTS
}

export interface IRoomState {
    roomId: string,
    numberOfPlayers: number,
    maxNumberOfPlayers: number
}

// {
//     players: [
//         {
//             player: 1,
//             score: 1000
//         },
//         {
//             player: 2,
//             score: 4000
//         }
//     ],
//     game: {
//         status: "started",
//         player: 1
//     }
// }

export enum GameStateStatus {
    WAITING_FOR_PLAYERS = 1,
    PLAYERS_READY,
    GAME_STARTED,
    GAME_OVER
}

export const teamTypes = ["left", "right"];
export type TeamType = typeof teamTypes[number];

export interface IPlayerState {
    id: string,
    playerNumber: number,
    team: TeamType,
    score: number
}

export interface IGameState {
    status: GameStateStatus,
    currentPlayer: IPlayerState | undefined
}

export interface IGameRoomState {
    players: IPlayerState[],
    game: IGameState
}