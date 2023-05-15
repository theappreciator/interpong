import { DEFAULTS, GameStateStatus, GAME_SCORE_EVENTS, GAME_SCORE_EVENT_POINTS, IBallState, IBallUpdateState, IGameRoomState, IPlayerState, IScoreData, IStartGame, randomIntegerBetween, randomNumberWithVariance, TeamType } from "@interpong/common";
import { getNextPlayerNumber, getOppositeTeamType, getRandomPlayerFromOtherTeam, getScoreForOtherTeam, getTeamForNextPlayer } from "@interpong/common";
import GameRoomStateService from "./gameRoomStateService";
import chalk from "chalk";
import * as log4js from "log4js";
import { getSomeBalls, getTeamLogString } from "../util/gameUtils";
import SocketPlayerAdapter from "./socketPlayerAdapter";
import { getLastPlayerFromBall, getTransferredBall } from "../util/ballUtil";
import ScoreService from "./scoreService";
const logger = log4js.getLogger();


export interface IGameService {
    addPlayer(playerId: string): IPlayerState;
    startGame(startGameAction: (playerStartGameData: IStartGame) => void, sendAction: (ball: IBallState, toPlayer: IPlayerState, gameRoomState: IGameRoomState) => void): void;
    startGameForPlayer(player: IPlayerState, startGameAction: (playerStartGameData: IStartGame) => void): void;
    removePlayer(player: IPlayerState, removeAction: (gameRoomState?: IGameRoomState) => void): void;
    addBalls(ballCount: number, sendImmediately: boolean, sendAction: (ball: IBallState, toPlayer: IPlayerState, gameRoomState: IGameRoomState) => void): void;
    transferBallToNextPlayer(rawBallData: IBallUpdateState, sendAction: (ball: IBallState, toPlayer: IPlayerState, gameRoomState: IGameRoomState) => void): void;
    updateScore(fromPlayer: IPlayerState, scoreData: IScoreData, sendAction: (gameRoomState: IGameRoomState) => void): void;
}


class GameService implements IGameService {

    private _gameId: string;

    constructor(gameId: string) {
        this._gameId = gameId;
    }

    addPlayer = (playerId: string): IPlayerState => {
        const gameRoomStateService = new GameRoomStateService(this._gameId);

        const playerNumbers = gameRoomStateService.players.map(p => p.playerNumber);
        const nextPlayerNumber = getNextPlayerNumber(playerNumbers);
        const player: IPlayerState = {
            id: playerId,
            playerNumber: nextPlayerNumber,
            team: getTeamForNextPlayer(gameRoomStateService.players, nextPlayerNumber),
            score: 0
        }

        gameRoomStateService.addOrUpdatePlayer(player);

        return player;
    }

    startGame = (startGameAction: (playerStartGameData: IStartGame) => void, sendAction: (ball: IBallState, toPlayer: IPlayerState, gameRoomState: IGameRoomState) => void) => {
        logger.info(chalk.white("Starting game:      ", this._gameId));

        const gameRoomStateService = new GameRoomStateService(this._gameId);

        const gameRoomState = gameRoomStateService.gameRoomState;
        const players = gameRoomState.players
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            this.startGameForPlayer(player, startGameAction);
        }

        const updatedGameRoomState = gameRoomStateService.updateStatus(GameStateStatus.GAME_STARTED);

        this.addBalls(1, true, sendAction);
    }

    startGameForPlayer = (player: IPlayerState, startGameAction: (playerStartGameData: IStartGame) => void) => {
        const gameRoomStateService = new GameRoomStateService(this._gameId);
        const gameRoomState = gameRoomStateService.gameRoomState;

        const playerStartGameData: IStartGame = {
            start: true,
            player: player,
            state: gameRoomState
        };

        startGameAction(playerStartGameData);
    }

    removePlayer = (player: IPlayerState, removeAction: (gameRoomState?: IGameRoomState) => void): void => {
        const gameRoomStateService = new GameRoomStateService(this._gameId);
        const gameRoomState = gameRoomStateService.deletePlayer(player);

        if (gameRoomState.players.length === 0) {
            gameRoomStateService.delete();

            removeAction();
        }
        else {
            removeAction(gameRoomState);
        }        
    }

    addBalls = (ballCount: number, sendImmediately: boolean, sendAction: (ball: IBallState, toPlayer: IPlayerState, gameRoomState: IGameRoomState) => void) => {
        const gameRoomStateService = new GameRoomStateService(this._gameId);
        // const newBalls = gameRoomStateService.addNewBallsToGame(ballCount);
        const newBalls = getSomeBalls(gameRoomStateService.players, ballCount);
        const updatedGameroomState = gameRoomStateService.addOrUpdateBalls(newBalls);

        for (const newBall of newBalls) {
            const toPlayer = SocketPlayerAdapter.playerFromPlayerNumber(this._gameId, getLastPlayerFromBall(newBall));
            logger.info(chalk.hex(newBall.color.toString(16)).underline(`Adding new ball:     ${this._gameId}: [${newBall.id}-(${toPlayer.id}-${getTeamLogString(toPlayer.team)}) px:${newBall.lastPosition.x} py:${newBall.lastPosition.y} dx:${newBall.lastDirection.x} dy:${newBall.lastDirection.y}]`));

            if (sendImmediately) {
                logger.info(chalk.hex(newBall.color.toString(16))(`Sending ball update: ${this._gameId}: [${newBall.id}-(${toPlayer.id}-${getTeamLogString(toPlayer.team, toPlayer.team)}) px:${newBall.lastPosition.x} py:${newBall.lastPosition.y} dx:${newBall.lastDirection.x} dy:${newBall.lastDirection.y}]`));

                sendAction(newBall, toPlayer, updatedGameroomState);
            }
            else {
                setTimeout(() => {
                    logger.info(chalk.hex(newBall.color.toString(16))(`Sending ball update: ${this._gameId}: [${newBall.id}-(${toPlayer.id}-${getTeamLogString(toPlayer.team, toPlayer.team)}) px:${newBall.lastPosition.x} py:${newBall.lastPosition.y} dx:${newBall.lastDirection.x} dy:${newBall.lastDirection.y}]`));

                    sendAction(newBall, toPlayer, updatedGameroomState);
                }, randomNumberWithVariance(DEFAULTS.ball.waitTimeMillisForNext, DEFAULTS.ball.waitTimeMillisForNextVariance));
            }
        }
    }

    transferBallToNextPlayer = (rawBallData: IBallUpdateState, sendAction: (ball: IBallState, toPlayer: IPlayerState, gameRoomState: IGameRoomState) => void) => {
        const gameRoomStateService = new GameRoomStateService(this._gameId);
        const originalHighestBounce = gameRoomStateService.gameRoomState.highestBounce;
        const existingBall = gameRoomStateService.ball(rawBallData.id);
        const fromPlayer = SocketPlayerAdapter.playerFromPlayerNumber(this._gameId, getLastPlayerFromBall(existingBall));
        logger.info(chalk.hex(existingBall.color.toString(16))(`Receive ball update: ${this._gameId}: [${existingBall.id}-(${fromPlayer.id}-${getTeamLogString(fromPlayer.team, getOppositeTeamType(fromPlayer.team))}) px:${rawBallData.lastPosition.x} py:${rawBallData.lastPosition.y} dx:${rawBallData.lastDirection.x} dy:${rawBallData.lastDirection.y}]`));

        const toPlayer = getRandomPlayerFromOtherTeam(gameRoomStateService.players, fromPlayer.team);
    
        const updatedBall = getTransferredBall(rawBallData, existingBall, toPlayer);
        const updatedGameRoomState = gameRoomStateService.addOrUpdateBall(updatedBall);

        logger.info(chalk.hex(updatedBall.color.toString(16))(`Sending ball update: ${this._gameId}: [${updatedBall.id}-(${toPlayer.id}-${getTeamLogString(toPlayer.team, toPlayer.team)}) px:${updatedBall.lastPosition.x} py:${updatedBall.lastPosition.y} dx:${updatedBall.lastDirection.x} dy:${updatedBall.lastDirection.y}]`));

        sendAction(updatedBall, toPlayer, updatedGameRoomState);    
    
        // if the highest bounce changed, and
        // if this ball was the one that caused it
        if ((originalHighestBounce != updatedGameRoomState.highestBounce) &&
            (updatedGameRoomState.highestBounce === updatedBall.bounces)) {
            if (updatedGameRoomState.highestBounce % 1 === 0) {
                this.addBalls(1, false, sendAction);
            }
        }
    }

    updateScore = (fromPlayer: IPlayerState, scoreData: IScoreData, sendAction: (gameRoomState: IGameRoomState) => void) => {
        const gameRoomStateService = new GameRoomStateService(this._gameId);

        logger.info(chalk.white(`Receive score event: ${this._gameId}: [from ${fromPlayer.id} event:${scoreData.event}]`));

        const scoreToPlayer = ScoreService.doScoreToPlayerForEvent(this._gameId, scoreData);
        const updatedGameRoomState = gameRoomStateService.addOrUpdatePlayer(scoreToPlayer);
        const scoreForTeam = getScoreForOtherTeam(gameRoomStateService.players, fromPlayer.team);

        logger.info(chalk.white(`Sending game score:  ${this._gameId}: [to   ${scoreToPlayer.id} new score:${scoreForTeam}]`));

        sendAction(updatedGameRoomState);
    }
}

export default GameService;
