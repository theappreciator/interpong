import { DEFAULTS } from "@interpong/common";
import { IBoardFactory } from ".";
import { BallType, PlayerType } from "../../sprites";
import { SoloMovementEvents, SpriteActions } from "../../sprites/events";
import { BasicBoard, BasicBoardProps, BoardType } from "../../View/BasicBoard";



class BasicBoardFactory implements IBoardFactory {
    constructor() {

    }

    makeBoard(playerSprite: PlayerType, handleMovementEvents:(movementEvent: SoloMovementEvents[], ball: BallType) => SpriteActions[]): BoardType {
        return this.makeBasicBoard(playerSprite, handleMovementEvents);
    }

    private makeBasicBoard(playerSprite: PlayerType, handleMovementEvents:(movementEvent: SoloMovementEvents[], ball: BallType) => SpriteActions[]): BoardType {
        const boardProps: BasicBoardProps = {
            width: DEFAULTS.width,
            height: DEFAULTS.height,
            backgroundColor: 0x456268,
            player: playerSprite,
            onMovementEvent: handleMovementEvents
        }

        return new BasicBoard(boardProps);
    }
}

export default BasicBoardFactory;