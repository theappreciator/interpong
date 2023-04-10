export type PressDirection = {
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean
}

export default class Controls {
    private _pressed!: PressDirection;
    private _keyDownListener: (ev: KeyboardEvent) => void;
    private _keyUpListener: (ev: KeyboardEvent) => void;

    constructor(keyDownLister: (ev: KeyboardEvent) => void, keyUpLister: (ev: KeyboardEvent) => void) {
        this.reset();

        this._keyDownListener = keyDownLister;
        this._keyUpListener = keyUpLister;
    }

    get pressed(): PressDirection {
        return this._pressed;
    }

    get left(): boolean {
        return this._pressed.left;
    }

    get leftUp(): boolean {
        return this._pressed.left && this._pressed.up;
    }

    get up(): boolean {
        return this._pressed.up;
    }

    get rightUp(): boolean {
        return this._pressed.right && this._pressed.up
    }

    get right(): boolean {
        return this._pressed.right;
    }

    get rightDown(): boolean {
        return this._pressed.right && this._pressed.down
    }

    get down(): boolean {
        return this._pressed.down;
    }

    get leftDown(): boolean {
        return this._pressed.left && this._pressed.down
    }

    get keyDownListener(): (ev: KeyboardEvent) => void {
        return this._keyDownListener;
    }

    get keyUpListener(): (ev: KeyboardEvent) => void {
        return this._keyUpListener;
    }

    set left(b: boolean) {
        this._pressed.left = b;
    }

    set up(b: boolean) {
        this._pressed.up = b;
    }

    set right(b: boolean) {
        this._pressed.right = b;
    }
    
    set down(b: boolean) {
        this._pressed.down = b;
    }
    
    reset() {
        this._pressed = {
            left: false,
            right: false,
            up: false,
            down: false
        };
    }
}