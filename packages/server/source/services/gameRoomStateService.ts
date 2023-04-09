import { GameStateStatus, GAME_SCORE_EVENTS, GAME_SCORE_EVENT_POINTS, IGameRoomState, IGameState, IPlayerState, ROOM_CONSTANTS, TeamType } from "@interpong/common";
import socket from "../socket";
import PersistService from "./persistService";



class GameRoomStateService {

    private _roomId: string;
    private _persist: PersistService<IGameRoomState>;

    constructor(roomId: string) {
        this._roomId = roomId
        this._persist = PersistService.Instance;

        const existingData = this._persist.retrieve(this._roomId);
        if (!existingData) {
            const initialGameRoomState: IGameRoomState = {
                players: [],
                game: {
                    status: GameStateStatus.WAITING_FOR_PLAYERS,
                    currentPlayer: undefined
                }
            };

            this._persist.save(this._roomId, initialGameRoomState);
        }
    }

    public getGameStateCurrentPlayer(): IPlayerState | undefined {
        return this.getGameRoomState().game.currentPlayer;
    }

    public getGameStateStatus(): GameStateStatus {
        return this.getGameRoomState().game.status;
    }

    public updateGameStateStatus(newStatus: GameStateStatus): IGameRoomState {
        const gameRoomState = {...this.getGameRoomState()};
        gameRoomState.game.status = newStatus;
        return this.updateGameRoomState(gameRoomState);
    }

    public getGameState(): IGameState {
        return this.getGameRoomState().game;
    }
    
    public updateGameState(gameState: IGameState): IGameRoomState {
        const gameRoomState = {...this.getGameRoomState()};
        gameRoomState.game = {...gameState};
        return this.updateGameRoomState(gameRoomState);
    }    

    public getPlayerState(socketId: string): IPlayerState {
        const playerState = this.getGameRoomState()?.players.find(p => p.id === socketId);
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

    public updatePlayerScore(socketId: string, event: GAME_SCORE_EVENTS): IGameRoomState {
        const pointsForEvent = GAME_SCORE_EVENT_POINTS[event] || 0;

        const gameRoomState = {...this.getGameRoomState()};
        // TODO: consider a scoring strategy to get passed in
        const otherPlayers = gameRoomState.players.filter(p => p.id !== socketId);
        otherPlayers.forEach(p => {
            p.score = p.score + pointsForEvent;
        })
        return this.updateGameRoomState(gameRoomState);
    }

    // TODO: obviously this needs to be updated to evenly distribute players to teams
    private getTeam(playerNumber: number): TeamType {
        if (playerNumber % 2 == 0) {
            return "right";
        }
        else {
            return "left";
        }
    }

    public addPlayer(socketId: string): IPlayerState {
        const gameRoomState = {...this.getGameRoomState()};
        const sortedPlayerNumbers = gameRoomState.players.map(p => p.playerNumber).sort((a, b) => a - b);
        let lastN = 0;
        for (const n of sortedPlayerNumbers) {
            if (n !== lastN + 1) {
                break;
            }
            lastN = n;
        }
        const playerNumber: number = lastN + 1;
        const player: IPlayerState = {
            id: socketId,
            playerNumber: playerNumber,
            team: this.getTeam(playerNumber),
            score: 0
        }
        gameRoomState.players.push(player);
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

    public updateGameRoomState(gameRoomState: IGameRoomState): IGameRoomState {
        this._persist.save(this._roomId, gameRoomState);
        return this.getGameRoomState();
    }

    public static deletePlayer(socketId: string) {
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
                    const player = gameRoomState.players.find(p => p.id === socketId);
                    if (player) {
                        const modifiedGameRoomState = {...gameRoomState};
                        const modifiedPlayers = gameRoomState.players.filter(p => p.id !== socketId)
                        modifiedGameRoomState.players = [...modifiedPlayers];
                        persistService.save(roomId, modifiedGameRoomState);
                    }
                }
            }
        })
    }
}

export default GameRoomStateService;