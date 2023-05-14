import { GameStateType, IGameState } from ".";
import { GamePageController } from "../controllers";
import BaseGameState from "./baseGameState";


class WaitingToConnectGameState extends BaseGameState implements IGameState {

    constructor(controller: GamePageController) {
        super(controller);
    }

    get type(): GameStateType {
        return "waiting_connect";
    }
}

export default WaitingToConnectGameState;