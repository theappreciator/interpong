import { IGameRoomState, IPlayerState, randomNumberBetween, TeamType } from "@interpong/common"
import { Server, Socket } from "socket.io";



const getPlayerFromSocket = (gameRoomState: IGameRoomState, socket: Socket): IPlayerState => {
    const playerState = gameRoomState.players.find(p => p.id === socket.id);
    if (!playerState) {
        throw new Error(`Error getting player from socket ${socket.id}`);
    }
    return playerState;
}

const getLeftTeam = (gameRoomState: IGameRoomState): IPlayerState[] => {
    return gameRoomState.players.filter(p => p.team === "left");
}

const getRightTeam = (gameRoomState: IGameRoomState): IPlayerState[] => {
    return gameRoomState.players.filter(p => p.team === "right");
}

const getScoreForTeam = (gameRoomState: IGameRoomState, team: TeamType): number => {
    return getTeam(gameRoomState, team).map(p => p.score).reduce((s, acc = 0) => s + acc);
}

const getOtherTeam = (gameRoomState: IGameRoomState, team: TeamType): IPlayerState[] => {
    if (team === "left") {
        return getRightTeam(gameRoomState);
    }
    else {
        return getLeftTeam(gameRoomState);
    }
}

const getTeam = (gameRoomState: IGameRoomState, team: TeamType): IPlayerState[] => {
    return gameRoomState.players.filter(p => p.team === team);
}

const getRandomPlayerFromTeam = (gameRoomState: IGameRoomState, team: TeamType): IPlayerState => {
    const players = getTeam(gameRoomState, team);
    const index = randomNumberBetween(0, (players.length - 1));

    return players[index];
}

const getRandomPlayerFromOtherTeam = (gameRoomState: IGameRoomState, team: TeamType): IPlayerState => {
    if (team === "left") {
        return getRandomPlayerFromTeam(gameRoomState, "right");
    }
    else {
        return getRandomPlayerFromTeam(gameRoomState, "left");
    }
}

export {
    getPlayerFromSocket,
    getTeam,
    getOtherTeam,
    getLeftTeam,
    getRightTeam,
    getScoreForTeam,
    getRandomPlayerFromTeam,
    getRandomPlayerFromOtherTeam
}