import { DEFAULTS, TeamType } from "@interpong/common";
import { IPlayerSpriteFactory } from ".";
import { PlayerType, RectanglePlayer } from "../../sprites";
import { SimpleHealthStrategy } from "../../strategies/SimpleHealthStrategy";
import SimpleSpeedStrategy from "../../strategies/SimpleSpeedStrategy";
import UpDownMoveStrategy from "../../strategies/UpDownMoveStrategy";



class RectanglePlayerSpriteFactory implements IPlayerSpriteFactory {
    constructor() {

    }

    makePlayerSprite = (team: TeamType): RectanglePlayer => {
        return this.makeRectanglePlayerSprite(team);
    }

    private makeRectanglePlayerSprite = (team: TeamType): PlayerType => {
        const playerShape = new RectanglePlayer(
            0xfcf8ec,
            DEFAULTS.player.width,
            DEFAULTS.player.height,
            {x:DEFAULTS.player.direction.x, y:DEFAULTS.player.direction.y},
            {
                // TODO use shared util to get x, y based on Team
                x: team === "left" ?
                    DEFAULTS.player.startPos.x : 
                    DEFAULTS.width - DEFAULTS.player.startPos.x - DEFAULTS.player.width,
                y: DEFAULTS.player.startPos.y
            },
            new UpDownMoveStrategy(),
            new SimpleSpeedStrategy(),
            new SimpleHealthStrategy()
        );

        return playerShape;
    }
}

export default RectanglePlayerSpriteFactory;
