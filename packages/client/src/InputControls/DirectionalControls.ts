import { Vector } from "@interpong/common";
import { IPlayer } from "../GameProperties/IPlayer";
import { functionIfCompare } from "../utils";
import KeyboardControls from "./KeyboardControls";
import PointerControls from "./PointerControls";

interface IDirectionalControls {
    addKeyboardInput(keyboardInput: KeyboardControls): void;
    addPointerInput(pointerInput: any): void;
}

type PressDirection = {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean
}

class DirectionalControls implements IDirectionalControls {
    private _pressed!: PressDirection;

    private _player: IPlayer;
    private _keyboardInputs: KeyboardControls[];
    private _pointerInputs: PointerControls[];

    constructor(player: IPlayer) {
        this._player = player;

        this._keyboardInputs = [];
        this._pointerInputs = [];

        this.reset();        
    }

    reset = () => {
        this._pressed = {
            left: false,
            right: false,
            up: false,
            down: false
        };
    }

    addKeyboardInput = (keyboardInput: KeyboardControls) => {
        this.setupKeyboardInput(keyboardInput);
        this._keyboardInputs.push(keyboardInput);
    }

    addPointerInput = (pointerInput: PointerControls) => {
        this.setupPointerInput(pointerInput);
        this._pointerInputs.push(pointerInput);
    }

    private setupKeyboardInput = (keyboardInput: KeyboardControls) => {
        const downKeyActions = new Map<string, Function>();
        ['a', 'A', 'ArrowLeft'].forEach(c => downKeyActions.set(c, this.pressLeft));
        ['d', 'D', 'ArrowRight'].forEach(c => downKeyActions.set(c, this.pressRight));
        ['w', 'W', 'ArrowUp'].forEach(c => downKeyActions.set(c, this.pressUp));
        ['s', 'S', 'ArrowDown'].forEach(c => downKeyActions.set(c, this.pressDown));
        keyboardInput.addKeyDownActions(downKeyActions);

        const upKeyActions = new Map<string, Function>();
        ['a', 'A', 'ArrowLeft'].forEach(c => upKeyActions.set(c, this.releaseLeft));
        ['d', 'D', 'ArrowRight'].forEach(c => upKeyActions.set(c, this.releaseRight));
        ['w', 'W', 'ArrowUp'].forEach(c => upKeyActions.set(c, this.releaseUp));
        ['s', 'S', 'ArrowDown'].forEach(c => upKeyActions.set(c, this.releaseDown));
        keyboardInput.addKeyUpActions(upKeyActions);
    }

    private setupPointerInput = (pointerInput: PointerControls) => {
        const clickDownActions: Function[] = [];
        const clickDownAction = (position: Vector) => {
            functionIfCompare(position.y, this._player.position.y, this.pressUp, this.pressDown, () => {})();
            functionIfCompare(position.x, this._player.position.x, this.pressLeft, this.pressRight, () => {})();
        }
        clickDownActions.push(clickDownAction);
        pointerInput.addClickDownActions(clickDownActions);

        const clickUpActions: Function[] = [];
        const clickUpAction = (clickPosition: Vector) => {
            this.releaseAll();
        }
        clickUpActions.push(clickUpAction);
        pointerInput.addClickUpActions(clickUpActions);

        const movementActions: Function[] = [];
        const movementAction = (position: Vector) => {
            if (this._player.activated) {
                functionIfCompare(position.y, this._player.position.y, this.pressUp, this.pressDown, () => {})();
                functionIfCompare(position.x, this._player.position.x, this.pressLeft, this.pressRight, () => {})();
            }
        }
        movementActions.push(movementAction);
        pointerInput.addMovementActions(movementActions);
    }

    private pressLeft = () => {
        this._pressed.left = true;
        this._player.moveLeft();
    }

    private pressDown = () => {
        this._pressed.down = true;
        this._player.moveDown();
    }

    private pressRight = () => {
        this._pressed.right = true;
        this._player.moveRight();
    }

    private pressUp = () => {
        this._pressed.up = true;
        this._player.moveUp();
    }

    private releaseLeft = () => {
        this._pressed.right ? this._player.moveRight() : this._player.stopLeft();
        this._pressed.left = false;
    }

    private releaseDown = () => {
        this._pressed.up ? this._player.moveUp() : this._player.stopDown();
        this._pressed.down = false;
    }

    private releaseRight = () => {
        this._pressed.left ? this._player.moveLeft() : this._player.stopRight();
        this._pressed.right = false;
    }

    private releaseUp = () => {
        this._pressed.down ? this._player.moveDown() : this._player.stopUp();
        this._pressed.up = false;
    }

    private releaseAll = () => {
        this._pressed = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        this._player.stopMoving();
    }
}

export default DirectionalControls;