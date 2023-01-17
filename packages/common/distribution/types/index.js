"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOM_CONSTANTS = exports.ROOM_EVENTS = exports.GAME_CONSTANTS = exports.GAME_EVENTS = exports.SOCKET_EVENTS = void 0;
var SOCKET_EVENTS;
(function (SOCKET_EVENTS) {
    SOCKET_EVENTS["PING"] = "ping";
    SOCKET_EVENTS["PONG"] = "pong";
})(SOCKET_EVENTS = exports.SOCKET_EVENTS || (exports.SOCKET_EVENTS = {}));
var GAME_EVENTS;
(function (GAME_EVENTS) {
    GAME_EVENTS["START_GAME"] = "start_game";
    GAME_EVENTS["ON_START_GAME"] = "on_start_game";
    GAME_EVENTS["READY_FOR_GAME"] = "ready_for_game";
    GAME_EVENTS["ON_READY_FOR_GAME"] = "on_ready_for_game";
    GAME_EVENTS["UPDATE_GAME"] = "update_game";
    GAME_EVENTS["ON_UPDATE_GAME"] = "on_update_game";
    GAME_EVENTS["WIN_GAME"] = "win_game";
    GAME_EVENTS["ON_WIN_GAME"] = "on_win_win";
})(GAME_EVENTS = exports.GAME_EVENTS || (exports.GAME_EVENTS = {}));
exports.GAME_CONSTANTS = {};
var ROOM_EVENTS;
(function (ROOM_EVENTS) {
    ROOM_EVENTS["JOIN_GAME"] = "join_game";
    ROOM_EVENTS["ON_JOIN_GAME"] = "on_join_game";
    ROOM_EVENTS["JOIN_GAME_ERROR"] = "join_game_error";
    ROOM_EVENTS["ROOM_JOINED"] = "room_joined";
    ROOM_EVENTS["ROOM_READY"] = "room_ready";
    ROOM_EVENTS["JESS_TEST"] = "SOMETHING";
})(ROOM_EVENTS = exports.ROOM_EVENTS || (exports.ROOM_EVENTS = {}));
exports.ROOM_CONSTANTS = {
    ROOM_IDENTIFIER: "ROOM|",
    ROOM_NUMBER_OF_PLAYERS_TO_START: 2,
    ROOM_MAX_NUMBER_OF_PLAYERS: 2
};
