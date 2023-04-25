import { GameStateStatus, GAME_SCORE_EVENTS, GAME_SCORE_EVENT_POINTS, IBallState, IGameRoomState, IGameState, IPlayerState, ROOM_CONSTANTS, TeamType } from "@interpong/common";
import { getOtherTeam, getRandomPlayerFromOtherTeam } from "../util/gameRoomUtils";
import { getSomeBalls } from "../util/gameUtils";
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
                },
                balls: [],
                highestBounce: 0
            };

            this._persist.save(this._roomId, initialGameRoomState);
        }
    }

    public getGameStateStatus(): GameStateStatus {
        return this.getGameRoomState().game.status;
    }

    public updateGameStateStatus(newStatus: GameStateStatus): IGameRoomState {
        const gameRoomState = {...this.getGameRoomState()};
        gameRoomState.game.status = newStatus;
        return this.updateGameRoomState(gameRoomState);
    }

    public updateGameStateStatusStarting(balls: IBallState[]): IGameRoomState {
        const gameRoomState = {...this.getGameRoomState()};
        gameRoomState.game.status = GameStateStatus.GAME_STARTING;
        gameRoomState.balls = [...balls];
        return this.updateGameRoomState(gameRoomState);
    }

    public addSomeBalls(numberOfBalls: number): IBallState[] {
        const gameRoomState = {...this.getGameRoomState()};
        const newBalls = getSomeBalls(gameRoomState.players, numberOfBalls);
        const existingBalls = [...gameRoomState.balls];
        gameRoomState.balls = existingBalls.concat(newBalls);
        this.updateGameRoomState(gameRoomState);

        return newBalls;
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

    public getBallState(ballId: string): IBallState {
        const ballState = this.getGameRoomState()?.balls.find(b => b.id === ballId);
        if (ballState) {
            return ballState;
        }
        else {
            throw new Error(`Ball State (ball ${ballId}) unexpectedly undefined`);
        }
    }

    // TODO: pass in a full socket if possible
    // TODO: pass in a ball id so we can attribute the last person that sent the ball and give them a score
    public updatePlayerScore(socketId: string, event: GAME_SCORE_EVENTS): IGameRoomState {
        const pointsForEvent = GAME_SCORE_EVENT_POINTS[event] || 0;

        const gameRoomState = {...this.getGameRoomState()};
        // TODO: consider a scoring strategy to get passed in
        const player = gameRoomState.players.find(p => p.id === socketId);
        if (!player) {
            throw new Error(`Error getting player from socket ${socketId}`);
        }
        const randomPlayerFromOtherTeam = getRandomPlayerFromOtherTeam(gameRoomState, player.team);
        randomPlayerFromOtherTeam.score = randomPlayerFromOtherTeam.score + pointsForEvent;

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

    // TODO: need to solve for atomically running this method
    public getGameRoomState(): IGameRoomState {
        const gameRoomState = this._persist.retrieve(this._roomId);
        if (gameRoomState) {
            return gameRoomState;
        }
        else {
            throw new Error("Game Room State unexpectedly undefined");
        }
    }

    // TODO: need to solve for atomically running this method, and failing if something changed
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
            // TODO: this should be in some helper logic.  "isRoom()"
            if (k.startsWith(ROOM_CONSTANTS.ROOM_IDENTIFIER.toLocaleLowerCase())) {
                const roomId = k;
                console.log("Working roomId", roomId);
                const originalGameRoomState = persistService.retrieve(roomId);
                if (originalGameRoomState) {
                    const player = originalGameRoomState.players.find(p => p.id === socketId);
                    if (player) {
                        const modifiedGameRoomState = {...originalGameRoomState};
                        const modifiedPlayers = originalGameRoomState.players.filter(p => p.id !== socketId)
                        modifiedGameRoomState.players = [...modifiedPlayers];
                        if (modifiedPlayers.length === 0 ) {
                            modifiedGameRoomState.highestBounce = 0;
                        }
                        persistService.save(roomId, modifiedGameRoomState);
                    }
                }
            }
        })
    }
}

export default GameRoomStateService;