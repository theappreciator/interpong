import { GameStateStatus, IBallState, IGameRoomState, IGameState, IPlayerState, ROOM_CONSTANTS } from "@interpong/common";
import { isRoomId } from "../util/roomUtils";
import PersistService from "./persistService";



export interface IGameRoomStateService {
    players: IPlayerState[];
    player(playerId: string): IPlayerState;
    addOrUpdatePlayers(players: IPlayerState[]): IGameRoomState;
    addOrUpdatePlayer(player: IPlayerState): IGameRoomState;
    deletePlayer(player: IPlayerState): void;
    balls: IBallState[];
    ball(ballId: string): IBallState;
    addOrUpdateBalls(balls: IBallState[]): IGameRoomState;
    addOrUpdateBall(ball: IBallState): IGameRoomState;
    gameRoomState: IGameRoomState;
    game: IGameState;
    status: GameStateStatus;
    updateStatus(newStatus: GameStateStatus): IGameRoomState;
    delete(): void;
}


class GameRoomStateService implements IGameRoomStateService {

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
                },
                balls: [],
                highestBounce: 0
            };

            this._persist.save(this._roomId, initialGameRoomState);
        }
    }

    get players(): IPlayerState[] {
        return this.getGameRoomState().players;
    }

    public player(playerId: string): IPlayerState {
        const playerState = this.getGameRoomState()?.players.find(p => p.id === playerId);
        if (playerState) {
            return playerState;
        }
        else {
            throw new Error(`Player State (player ${playerId}) unexpectedly undefined`);
        }
    }

    public addOrUpdatePlayers(players: IPlayerState[]): IGameRoomState {
        const updatedPlayers: IPlayerState[] = [];
        for (const player of players) {
            let addedPlayer = false;
            for (let i = 0; i < this.players.length; i++) {
                const refPlayer = this.players[i];
                if (refPlayer.id === player.id) {
                    updatedPlayers.push({...player});
                    addedPlayer = true;
                }
                else {
                    updatedPlayers.push({...refPlayer});
                }
            }

            if (!addedPlayer) {
                updatedPlayers.push({...player});
            }
        }

        const updatedGameRoomState = {...this.getGameRoomState()};
        updatedGameRoomState.players = updatedPlayers;

        return this.updateGameRoomState(updatedGameRoomState);
    }

    public addOrUpdatePlayer(player: IPlayerState): IGameRoomState {
        const updatedPlayers = [];
        let addedPlayer = false;

        for (let i = 0; i < this.players.length; i++) {
            const refPlayer = this.players[i];
            if (refPlayer.id === player.id) {
                updatedPlayers.push({...player});
                addedPlayer = true;
            }
            else {
                updatedPlayers.push({...refPlayer});
            }
        }

        if (!addedPlayer) {
            updatedPlayers.push({...player});
        }

        const updatedGameRoomState = {...this.getGameRoomState()};
        updatedGameRoomState.players = updatedPlayers;

        return this.updateGameRoomState(updatedGameRoomState);
    }

    public deletePlayer(player: IPlayerState): IGameRoomState {
        const updatedPlayers = [];
        let deletedPlayer = false;

        for (let i = 0; i < this.players.length; i++) {
            const refPlayer = this.players[i];
            if (refPlayer.id === player.id) {
                //updatedPlayers.push({...player});
                deletedPlayer = true;
            }
            else {
                updatedPlayers.push({...refPlayer});
            }
        }

        if (!deletedPlayer) {
            throw new Error(`Error deleting player ${player.id}, could not be found`);
        }

        const updatedGameRoomState = {...this.getGameRoomState()};
        updatedGameRoomState.players = updatedPlayers;

        return this.updateGameRoomState(updatedGameRoomState);
    }


    get balls(): IBallState[] {
        return this.getGameRoomState().balls;
    }

    public ball(ballId: string): IBallState {
        const ballState = this.getGameRoomState()?.balls.find(b => b.id === ballId);
        if (ballState) {
            return ballState;
        }
        else {
            throw new Error(`Ball State (ball ${ballId}) unexpectedly undefined`);
        }
    }

    public addOrUpdateBalls(balls: IBallState[]): IGameRoomState {
        const updatedBalls: IBallState[] = [];
        for (const ball of balls) {
            let addedBall = false;
            for (let i = 0; i < this.balls.length; i++) {
                const refBall = this.balls[i];
                if (refBall.id === ball.id) {
                    updatedBalls.push({...ball});
                    addedBall = true;
                }
                else {
                    updatedBalls.push({...refBall});
                }
            }

            if (!addedBall) {
                updatedBalls.push({...ball});
            }
        }

        const updatedGameRoomState = {...this.getGameRoomState()};
        updatedGameRoomState.balls = updatedBalls;

        const ballWithHighestBounce = updatedBalls.sort((a, b) => a.bounces - b.bounces)[0];

        if (updatedGameRoomState.highestBounce < ballWithHighestBounce.bounces) {
            updatedGameRoomState.highestBounce = ballWithHighestBounce.bounces;         
        }

        return this.updateGameRoomState(updatedGameRoomState);
    }

    public addOrUpdateBall(ball: IBallState): IGameRoomState {
        const updatedBalls = [];
        let addedBall = false;

        for (let i = 0; i < this.balls.length; i++) {
            const refBall = this.balls[i];
            if (refBall.id === ball.id) {
                updatedBalls.push({...ball});
                addedBall = true;
            }
            else {
                updatedBalls.push({...refBall});
            }
        }

        if (!addedBall) {
            updatedBalls.push({...ball});
        }

        const updatedGameRoomState = {...this.getGameRoomState()};
        updatedGameRoomState.balls = updatedBalls;
        if (updatedGameRoomState.highestBounce < ball.bounces) {
            updatedGameRoomState.highestBounce = ball.bounces;         
        }

        return this.updateGameRoomState(updatedGameRoomState);
    }

    get gameRoomState(): IGameRoomState {
        return this.getGameRoomState();
    }

    get game(): IGameState {
        return this.getGameRoomState().game
    }

    get status(): GameStateStatus {
        return this.getGameRoomState().game.status;
    }

    public updateStatus(newStatus: GameStateStatus): IGameRoomState {
        const gameRoomState = {...this.getGameRoomState()};
        gameRoomState.game.status = newStatus;
        return this.updateGameRoomState(gameRoomState);
    }

    public delete(): void {
        this._persist.delete(this._roomId);
    }

    // TODO: need to solve for atomically running this method
    private getGameRoomState(): IGameRoomState {
        const gameRoomState = this._persist.retrieve(this._roomId);
        if (gameRoomState) {
            return gameRoomState;
        }
        else {
            throw new Error("Game Room State unexpectedly undefined");
        }
    }

    // TODO: need to solve for atomically running this method, and failing if something changed
    private updateGameRoomState(gameRoomState: IGameRoomState): IGameRoomState {
        this._persist.save(this._roomId, gameRoomState);
        return this.getGameRoomState();
    }

    public static deletePlayerById(playerId: string): void {
        const persistService: PersistService<IGameRoomState> = PersistService.Instance;
        const keys = persistService.getKeys();
        keys.forEach(k => {
            // TODO: this should be in some helper logic.  "isRoom()"
            if (isRoomId(k)) {
                const roomId = k;
                const originalGameRoomState = persistService.retrieve(roomId);
                if (originalGameRoomState) {
                    const player = originalGameRoomState.players.find(p => p.id === playerId);
                    if (player) {
                        const modifiedGameRoomState = {...originalGameRoomState};
                        const modifiedPlayers = originalGameRoomState.players.filter(p => p.id !== playerId)
                        modifiedGameRoomState.players = [...modifiedPlayers];
                        
                        persistService.save(roomId, modifiedGameRoomState);
                    }
                }
            }
        })
    }

    public static getPlayerById(playerId: string): IPlayerState {
        const persistService: PersistService<IGameRoomState> = PersistService.Instance;
        const keys = persistService.getKeys();

        for (const k of keys) {
            // TODO: this should be in some helper logic.  "isRoom()"
            if (isRoomId(k)) {
                const roomId = k;
                const originalGameRoomState = persistService.retrieve(roomId);

                if (originalGameRoomState) {
                    const player = originalGameRoomState.players.find(p => p.id === playerId);
                    if (player) {
                        return player;
                    }
                }
            }
        }

        throw new Error(`Could not find player with id ${playerId}`)
    }

    public static getRoomByPlayerById(playerId: string): string | undefined {
        const persistService: PersistService<IGameRoomState> = PersistService.Instance;
        const keys = persistService.getKeys();

        for (const k of keys) {
            // TODO: this should be in some helper logic.  "isRoom()"
            if (isRoomId(k)) {
                const roomId = k;
                const originalGameRoomState = persistService.retrieve(roomId);

                if (originalGameRoomState) {
                    const player = originalGameRoomState.players.find(p => p.id === playerId);
                    if (player) {
                        return roomId;
                    }
                }
            }
        }

        return undefined;
    }


}

export default GameRoomStateService;