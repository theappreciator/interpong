import { IPlayerState } from "../types";

const mockPlayer1: IPlayerState = {
    id: "ABCD",
    playerNumber: 1,
    team: "left",
    score: 0
};

const mockPlayer2: IPlayerState = {
    id: "ZYXW",
    playerNumber: 2,
    team: "right",
    score: 50
};

export {
    mockPlayer1,
    mockPlayer2,
}