import { IBallState, IGameRoomState, IRoomState, IStartGame } from "@interpong/common";
import { GameStateType, IGameState, SelectingRoomGameState, WaitingInRoomGameState, PlayingGameState, WaitingToConnectGameState } from ".";
import { GamePageController } from "../controllers";


abstract class BaseGameState implements IGameState {

    protected _controller: GamePageController;

    constructor(pageController: GamePageController) {
        this._controller = pageController
    }

    abstract get type(): GameStateType;

    handleStartingUp(): void {
        throw new Error("Method not implemented.");
    }
    handleConnectedToServer = (): void => {
        const state = new SelectingRoomGameState(this._controller);
        this._controller.setGameState(state);

        this._controller.transitionUI(state.type);

        this._controller.doConnected();
        
    }
    handleDisconnectedFromServer = (wasConnected: boolean, e: any): void => {
        this._controller.destroyGameObjects();

        const state = new WaitingToConnectGameState(this._controller);
        this._controller.setGameState(state);

        // TODO: this.type problably needs to be state.type, as the state just changed to something other than this class.
        this._controller.transitionUI(this.type);

        this._controller.doDisconnected(wasConnected, e);
    }

    handleReconnectedToServer = (): void => {        
        const state = new SelectingRoomGameState(this._controller);
        this._controller.setGameState(state);

        this._controller.transitionUI(this.type);

        this._controller.doReConnected();
    }



    handleRoomListUpdate = (roomStates: IRoomState[]): void => {
        this._controller.doRoomListUpdate(roomStates);
    }

    handleJoiningRoom = (roomName: string | undefined): void => {
        this._controller.joinRoom(roomName)
        .then((roomName) =>  {
            const state = new WaitingInRoomGameState(this._controller);
            this._controller.setGameState(state);

            this._controller.transitionUI(state.type);
        });
    }

    handleRoomReadyToStartGame = (roomState: IRoomState) => {
        console.log("The room is ready!", roomState.roomId);
    }

    handleDisconnectingFromRoom(): void {
        throw new Error("Method not implemented.");
    }



    handleStartGame = (startGameData: IStartGame): void => {
        const state = new PlayingGameState(this._controller);
        this._controller.setGameState(state);

        this._controller.transitionUI(state.type)

        this._controller.startGame(startGameData);
    }
    handleEndingGame(): void {
        throw new Error("Method not implemented.");
    }

    handleGameBallEnteredBoard = (ball: IBallState) => {
        console.log("Making a ball from onGameBallEnterBoard", ball);
        this._controller.makeIncomingBall(ball);
    }

    handleGameScoreChange = (gameRoomState: IGameRoomState): void => {
        this._controller.doScoreChange(gameRoomState)
    }
}

export default BaseGameState;