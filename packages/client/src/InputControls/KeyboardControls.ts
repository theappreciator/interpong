interface IKeyboardControls {
    // setup(): void;
    remove(): void;
    addKeyDownActions(actions: Map<string, Function>): void;
    addKeyUpActions(actions: Map<string, Function>): void;
}

class KeyboardControls implements IKeyboardControls {
    private _downKeyActions: Map<string, Function>;
    private _upKeyActions: Map<string, Function>;

    constructor() {
        this._downKeyActions = new Map<string, Function>();
        this._upKeyActions = new Map<string, Function>();

        this.setup();
    }

    addKeyDownActions = (actions: Map<string, Function>) => {
        for (const [key, action] of actions) {
            this._downKeyActions.set(key, action);
        }
    }

    addKeyUpActions = (actions: Map<string, Function>) => {
        for (const [key, action] of actions) {
            this._upKeyActions.set(key, action);
        }
    }

    remove = () => {
        this.removeControls();
    }

    private setup = (): void => {
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }
    
    private removeControls = (): void => {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
    }

    private onKeyDown = (ev: KeyboardEvent): void => {
        const action = this._downKeyActions.get(ev.key);

        if (action) {
            action();
        }
    }

    private onKeyUp = (ev: KeyboardEvent): void => {
        const action = this._upKeyActions.get(ev.key);

        if (action) {
            action();
        }
    }
}

export default KeyboardControls;