import Player from "../sprites/RectanglePlayer";
import { MoveStrategy } from "./MoveStrategy";
import * as PIXI from 'pixi.js';
import BaseMoveStrategy from "./BaseMoveStrategy";
import { Vector } from "@interpong/common";



export default class SimpleMoveStrategy extends BaseMoveStrategy implements MoveStrategy {    
    public onPointerDown(downPosition: Vector, player: Player) {

    }
    public onPointerUp(upPosition: Vector, player: Player) {
        
    }  
    public onPointerMove(position: Vector, player: Player): void {
        
    }
}