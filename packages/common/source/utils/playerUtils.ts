import { randomIntegerBetween } from ".";
import { IPlayerState, TeamType } from "../types";



// TODO: obviously this needs to be updated to evenly distribute players to teams
const getTeamForNextPlayer = (players: IPlayerState[], playerNumber: number): TeamType => {
    if (playerNumber % 2 == 0) {
        return "right";
    }
    else {
        return "left";
    }
}

const getNextPlayerNumber = (playerNumbers: number[]) => {
    const sortedPlayerNumbers = playerNumbers.sort((a, b) => a - b);

    let lastN = 0;
    for (const n of sortedPlayerNumbers) {
        if (n !== lastN + 1) {
            break;
        }
        lastN = n;
    }
    const playerNumber: number = lastN + 1;
    
    return playerNumber;
}

const getOppositeTeamType = (team: TeamType): TeamType => {
    if (team === "left") {
        return "right";
    }
    else {
        return "left"
    }
}

const getTeam = (players: IPlayerState[], team: TeamType): IPlayerState[] => {
    return players.filter(p => p.team === team);
}

const getRandomPlayerFromTeam = (players: IPlayerState[], team: TeamType): IPlayerState => {
    const playersOnTeam = getTeam(players, team);
    const index = randomIntegerBetween(0, (playersOnTeam.length - 1));

    return playersOnTeam[index];
}

const getRandomPlayerFromOtherTeam = (players: IPlayerState[], team: TeamType): IPlayerState => {
    if (team === "left") {
        return getRandomPlayerFromTeam(players, "right");
    }
    else {
        return getRandomPlayerFromTeam(players, "left");
    }
}

const getScoreForTeam = (players: IPlayerState[], team: TeamType) => {
    return getTeam(players, team).map(p => p.score).reduce((s, acc = 0) => s + acc);
}

const getScoreForOtherTeam = (players: IPlayerState[], team: TeamType): number => {
    if (team === "left") {
        return getScoreForTeam(players, "right");
    }
    else {
        return getScoreForTeam(players, "left");
    }
}


export {
    getTeamForNextPlayer,
    getNextPlayerNumber,
    getOppositeTeamType,
    getTeam,
    getRandomPlayerFromTeam,
    getRandomPlayerFromOtherTeam,
    getScoreForTeam,
    getScoreForOtherTeam
}