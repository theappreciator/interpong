import { GAME_SCORE_EVENTS, GAME_SCORE_EVENT_POINTS, getRandomPlayerFromOtherTeam, IBallState, IGameRoomState, IPlayerState, IScoreData } from "@interpong/common";
import GameRoomStateService from "./gameRoomStateService";
import SocketPlayerAdapter from "./socketPlayerAdapter";


class ScoreService {
    constructor() {

    }

    static doScoreToPlayerForEvent = (roomId: string, scoreData: IScoreData): IPlayerState => {
        const gameRoomStateService = new GameRoomStateService(roomId);

        const pointsForEvent = GAME_SCORE_EVENT_POINTS[scoreData.event] || 0;
        const ball = gameRoomStateService.ball(scoreData.ballId);

        const ballLastPlayerNumber = ball.players.at(-1);
        if (!ballLastPlayerNumber) {
            throw new Error(`Could not determine source-player to do scoring`);
        }
        let scoreSourcePlayer: IPlayerState = {...SocketPlayerAdapter.playerFromPlayerNumber(roomId, ballLastPlayerNumber)};
        let scoreToPlayer: IPlayerState | undefined;

        switch (scoreData.event) {
            case GAME_SCORE_EVENTS.WALL_HIT:
                const ballLastTransitionedPlayerNumber = ball.players.at(-2);

                if (typeof ballLastTransitionedPlayerNumber === "undefined") {
                    // This covers the beginning of the game where the ball has only existed for one player
                    scoreToPlayer = {...getRandomPlayerFromOtherTeam(gameRoomStateService.players, scoreSourcePlayer.team)};
                }
                else {
                    // This covers all future cases after the ball leaves the first screen
                    scoreToPlayer = {...SocketPlayerAdapter.playerFromPlayerNumber(roomId, ballLastTransitionedPlayerNumber)};
                }
                break;
            case GAME_SCORE_EVENTS.PLAYER_HIT:
                scoreToPlayer = scoreSourcePlayer;
                break;
            default:
                break;
        }

        if (!scoreToPlayer) {
            throw new Error(`Could not determine to-player to do scoring`);
        }
        scoreToPlayer.score = scoreToPlayer.score + pointsForEvent;

        return scoreToPlayer;
    }
}

export default ScoreService;