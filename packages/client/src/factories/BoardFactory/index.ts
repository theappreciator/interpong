import { PlayerType, BallType } from "../../sprites";
import { SoloMovementEvents, SpriteActions } from "../../sprites/events";
import { BoardType } from "../../View/BasicBoard";

export * from "./basicBoardFactory";

export interface IBoardFactory {
    makeBoard(playerSprite: PlayerType, handleMovementEvents:(movementEvent: SoloMovementEvents[], ball: BallType) => SpriteActions[]): BoardType;
}