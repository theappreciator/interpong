import { Vector } from "@interpong/common";
import { BoardType } from "../View/BasicBoard";


interface IPointerControl {
    addClickDownActions(actions: Function[]): void;
    addClickUpActions(actions: Function[]): void;
    addMovementActions(actions: Function[]): void;
}

class PointerControl implements IPointerControl {

    private _downKeyActions: Function[];
    private _upKeyActions: Function[];
    private _movementActions: Function[];

    constructor() {
        this._downKeyActions = [];
        this._upKeyActions = [];
        this._movementActions = [];
    }

    addClickDownActions = (actions: Function[]): void => {
        this._downKeyActions = this._downKeyActions.concat(actions);
    }

    addClickUpActions = (actions: Function[]): void => {
        this._upKeyActions = this._upKeyActions.concat(actions);
    }

    addMovementActions = (actions: Function[]): void => {
        this._movementActions = this._movementActions.concat(actions);
    }

    public onClickDown = (position: Vector) => {
        this._downKeyActions.forEach(a => a(position));
    }

    public onClickUp = (position: Vector) => {
        this._upKeyActions.forEach(a => a(position));
    }

    public onMovement = (position: Vector) => {
        this._movementActions.forEach(a => a(position));
    }
}

export default PointerControl;