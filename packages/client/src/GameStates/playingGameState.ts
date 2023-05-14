import { GameStateType, IGameState } from ".";
import { GamePageController } from "../controllers";
import BaseGameState from "./baseGameState";


class PlayingGameState extends BaseGameState implements IGameState {

    constructor(controller: GamePageController) {
        super(controller);
    }

    get type(): GameStateType {
        return "game_ready";
    }
}

export default PlayingGameState;