import { GameStateType, IGameState } from ".";
import { GamePageController } from "../controllers";
import BaseGameState from "./baseGameState";


class SelectingRoomGameState extends BaseGameState implements IGameState {

    constructor(controller: GamePageController) {
        super(controller);
    }

    get type(): GameStateType {
        return "game_room_selector";
    }
}

export default SelectingRoomGameState;