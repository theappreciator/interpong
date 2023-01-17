export enum SOCKET_EVENTS {
    PING = "ping",
    PONG = "pong"
}

export enum GAME_EVENTS {
    START_GAME = "start_game",
    ON_START_GAME = "on_start_game",
    READY_FOR_GAME = "ready_for_game",
    ON_READY_FOR_GAME = "on_ready_for_game",
    UPDATE_GAME = "update_game",
    ON_UPDATE_GAME = "on_update_game",
    WIN_GAME = "win_game",
    ON_WIN_GAME = "on_win_win",
}

export const GAME_CONSTANTS = {
    
}

export enum ROOM_EVENTS {
    JOIN_GAME = "join_game",
    ON_JOIN_GAME = "on_join_game",
    JOIN_GAME_ERROR = "join_game_error",
    ROOM_JOINED = "room_joined",
    ROOM_READY = "room_ready",
    JESS_TEST = "SOMETHING"
}

export const ROOM_CONSTANTS = {
    ROOM_IDENTIFIER: "ROOM|",
    ROOM_NUMBER_OF_PLAYERS_TO_START: 2,
    ROOM_MAX_NUMBER_OF_PLAYERS: 2
}