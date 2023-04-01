import { ROOM_CONSTANTS } from "@interpong/common";
import socket from "../socket";
import PersistService from "./persistService";


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

export interface IPlayerState {
    player: number,
    score: number
}

export interface IGameState {
    status: GameStateStatus,
    currentPlayer: number
}

export interface IGameRoomState {
    players: Map<string, IPlayerState>,
    game: IGameState
}

class GameRoomStateService {

    private _roomId: string;
    private _persist: PersistService<IGameRoomState>;

    constructor(roomId: string) {
        this._roomId = roomId
        this._persist = PersistService.Instance;

        const existingData = this._persist.retrieve(this._roomId);
        if (!existingData) {
            const initialGameRoomState: IGameRoomState = {
                players: new Map(),
                game: {
                    status: GameStateStatus.WAITING_FOR_PLAYERS,
                    currentPlayer: 0
                }
            };

            this._persist.save(this._roomId, initialGameRoomState);
        }
    }

    public getGameStateCurrentPlayer(): number {
        return this.getGameRoomState().game.currentPlayer;
    }

    public getGameStateStatus(): GameStateStatus {
        return this.getGameRoomState().game.status;
    }

    public updateGameStateStatus(newStatus: GameStateStatus): void {
        const gameRoomState = {...this.getGameRoomState()};
        gameRoomState.game.status = newStatus;
        this.updateGameRoomState(gameRoomState);
    }

    public getGameState(): IGameState {
        return this.getGameRoomState().game;
    }
    
    public updateGameState(gameState: IGameState): void {
        const gameRoomState = {...this.getGameRoomState()};
        gameRoomState.game = {...gameState};
        this.updateGameRoomState(gameRoomState);
    }    

    public getPlayerState(socketId: string): IPlayerState {
        const playerState = this.getGameRoomState()?.players.get(socketId);
        if (playerState) {
            return playerState;
        }
        else {
            throw new Error(`Player State (player ${socketId}) unexpectedly undefined`);
        }
    }

    // public updatePlayerState(playerState: IPlayerState): void {
    //     const gameRoomState = {...this.getGameRoomState()};
    //     gameRoomState.players.set(playerState.player, playerState);
    // }

    public addPlayer(socketId: string): IPlayerState {
        const gameRoomState = {...this.getGameRoomState()};
        const sortedPlayerNumbers = Array.from(gameRoomState.players.values()).map(v => v.player).sort((a, b) => a - b);
        let lastN = 0;
        for (const n of sortedPlayerNumbers) {
            if (n !== lastN + 1) {
                break;
            }
            lastN = n;
        }
        const playerNumber: number = lastN + 1;
        const player: IPlayerState = {
            player: playerNumber,
            score: 0
        }
        gameRoomState.players.set(socketId, player);
        this.updateGameRoomState(gameRoomState);
        
        return player;
    }

    public getGameRoomState(): IGameRoomState {
        const gameRoomState = this._persist.retrieve(this._roomId);
        if (gameRoomState) {
            return gameRoomState;
        }
        else {
            throw new Error("Game Room State unexpectedly undefined");
        }
    }

    public updateGameRoomState(gameRoomState: IGameRoomState) {
        this._persist.save(this._roomId, gameRoomState);
    }

    public static deletePlayerFromAllRooms(socketId: string) {
        const persistService: PersistService<IGameRoomState> = PersistService.Instance;
        const keys = persistService.getKeys();
        console.log("deleting", socketId);
        console.log("keys", keys);
        keys.forEach(k => {
            if (k.startsWith(ROOM_CONSTANTS.ROOM_IDENTIFIER.toLocaleLowerCase())) {
                const roomId = k;
                console.log("Working roomId", roomId);
                const gameRoomState = persistService.retrieve(roomId);
                if (gameRoomState) {
                    const playerKeys = Array.from(gameRoomState.players.keys());
                    if (playerKeys.includes(socketId)) {
                        const modifiedGameRoomState = {...gameRoomState};
                        modifiedGameRoomState.players.delete(socketId);
                        persistService.save(roomId, modifiedGameRoomState);
                    }
                }
            }
        })
    }
}

export default GameRoomStateService;