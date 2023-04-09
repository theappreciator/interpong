import Player from "../sprites/RectanglePlayer";
import { MoveStrategy } from "./MoveStrategy";
import * as PIXI from 'pixi.js';
import BaseMoveStrategy from "./BaseMoveStrategy";
import { Vector } from "@interpong/common";



export default class SimpleMoveStrategy extends BaseMoveStrategy implements MoveStrategy {    
    protected onPointerDown(downPosition: Vector, player: Player) {

    }
    protected onPointerUp(upPosition: Vector, player: Player) {
        
    }  
    protected onPointerMove(position: Vector, player: Player): void {
        
    }
}