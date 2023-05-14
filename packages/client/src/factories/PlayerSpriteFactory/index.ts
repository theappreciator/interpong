import { TeamType } from "@interpong/common";
import { PlayerType } from "../../sprites";

export * from "./rectanglePlayerSpriteFactory";

export interface IPlayerSpriteFactory {
    makePlayerSprite(team: TeamType): PlayerType
}