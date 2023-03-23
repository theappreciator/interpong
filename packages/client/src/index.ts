import * as PIXI from 'pixi.js';
import { DEFAULTS } from './constants';
import Controls from './Controls';
import SimpleMoveStrategy from './strategies/SimpleMoveStrategy';
import { Player, Coin, Monster } from './sprites';
import { Board, BoardProps } from './View/Board';
import SimpleSpeedStrategy from './strategies/SimpleSpeedStrategy';
import { SimpleHealthStrategy } from './strategies/SimpleHealthStrategy';
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { SocketService } from "./services";
import { start } from 'repl';
import { IPlayData, IStartGame } from './types';
import { SocketGameRoomController } from './controllers/';
import { GAME_EVENTS } from '@interpong/common';



function shake(app: PIXI.Application, className: string) {
    return;

   app.view.className = className;
   setTimeout(()=>{app.view.className = ""}, 50);
}

function onkeydown(ev: KeyboardEvent, player: Player) {
    switch (ev.key) {
        case "ArrowLeft":
        case "a":
            player.moveLeft();
            controls.left = true;
            break;

        case "ArrowRight":
        case "d":
            player.moveRight();
            controls.right = true;
            break;

        case "ArrowUp":
        case "w":
            player.moveUp();
            controls.up = true;
            break;

        case "ArrowDown": 
        case "s":
            player.moveDown();
            controls.down = true;
            break;
    }
}
function onkeyup(ev: KeyboardEvent, player: Player) {
    switch (ev.key) {
        case "ArrowLeft": 
        case "a":
            controls.right ? player.moveRight() : player.stopLeft();
            controls.left = false;
            break;

        case "ArrowRight": 
        case "d":
            controls.left ? player.moveLeft() : player.stopRight();
            controls.right = false;
            break;

        case "ArrowUp": 
        case "w":
            controls.down ? player.moveDown() : player.stopUp();
            controls.up = false;
            break;

        case "ArrowDown": 
        case "s":
            controls.up ? player.moveUp() : player.stopDown();
            controls.down = false;
            break;
    }
}

function setupControls() {
    window.addEventListener("keydown", controls.keyDownListener);
    window.addEventListener("keyup", controls.keyUpListener);
}

function removeControls() {
    window.removeEventListener("keydown", controls.keyDownListener);
    window.removeEventListener("keyup", controls.keyUpListener);

    controls.reset();
}

function gameOver() {

    isPlaying = false;

    board.app.ticker.stop();

    board.app.ticker.remove(gameLoop);
    endCombo();
    endFps();

    removeControls();

    setStatusText("Game Over!");
    console.log("GAME OVER");

    showActions();
}

function showActions() {
    const actions: HTMLObjectElement | null = document.querySelector('#actions') as HTMLObjectElement;
    if (actions)
        actions.style.visibility = "visible";
}

function hideActions() {
    const actions: HTMLObjectElement | null = document.querySelector('#actions') as HTMLObjectElement;
    if (actions)
        actions.style.visibility = "hidden";
}

function setStatusText(str: string) {
    const statusElement: HTMLObjectElement | null = document.querySelector("#status");
    if (statusElement)
        statusElement.innerHTML = str;
}

function reset() {

    board.reset();

    updateScore(0);
    updateLevel(0);
    updateCombo(1);

    setStatusText("");

    hideActions();
}

function updateScore(num: number) {
    score = num;
    const scoreElement = document.querySelector('#score span');
    if (scoreElement) 
        scoreElement.innerHTML = score.toLocaleString();
}

function updateLevel(num: number) {
    level = num;
    const levelElement = document.querySelector('#level span');
    if (levelElement) 
    levelElement.innerHTML = level.toString();
}

function updateCombo(num: number) {
    combo = num;
    const levelElement = document.querySelector('#combo span');
    if (levelElement) 
        levelElement.innerHTML = combo.toFixed(2) + "x";
}

function updateHealth(health: number) {
    const healthElement = document.querySelector('#health span');
    if (healthElement) 
        healthElement.innerHTML = health.toFixed(0);
}

const startCombo = () => {
    const shouldStartTimer = combo <= 1;

    combo += DEFAULTS.combo.bonus;

    updateCombo(combo);
    if (shouldStartTimer) {
        board.app.ticker.add(continueCombo);
    }
}

function endCombo() {
    board.app.ticker.remove(continueCombo);
}

function continueCombo(delta: number) {
    let newCombo = combo - DEFAULTS.combo.interval;
    if (newCombo <= 1) {
        newCombo = 1;
        endCombo();
    }

    updateCombo(newCombo);
}

const playerCollideWithCoin = () => {
    console.log("Collided with coin");

    updateScore( score + (combo * DEFAULTS.score.increment));

    startCombo();

    updateLevel(level+1);
}

const playerCollideWithMonster = (continuePlaying: boolean) => {
    console.log("Collided with monster", continuePlaying);

    updateHealth(board.player.health);

    if (!continuePlaying) {
        gameOver();
    }
}

function initGameObjects() {
    const player = new Player(0xfcf8ec, 10, {x:0, y:0}, { x:0, y:0 }, new SimpleMoveStrategy(), new SimpleSpeedStrategy(), new SimpleHealthStrategy());
    //player.speed = 4;
    const coin = new Coin(0xfcf8ec, 10, {x:0, y:0}, {x:0, y:0});
    const monsters: Monster[] = [];
    controls = new Controls(
        (e) => onkeydown(e, player),
        (e) => onkeyup(e, player)
    );

    const boardProps: BoardProps = {
        width: DEFAULTS.width,
        height: DEFAULTS.height,
        backgroundColor: 0x456268,
        player,
        coin,
        monsters,
        onPlayerCollideWithMonster: playerCollideWithMonster,
        onPlayerCollideWithCoin: playerCollideWithCoin
    }
    board = new Board(boardProps);
    board.app.ticker.add((delta) => console.log("tick"));

    score = 0;
    level = 0;
    combo = 1;

    const canvasElement = document.getElementById("canvas");
    canvasElement?.appendChild(board.app.view);

    const playButton: HTMLObjectElement | null = document.querySelector("#play");
    if (playButton)
        playButton.addEventListener("click", () => startGame());

}

function destroyGameObjects() {
    console.log("Destroying game!");

    gameOver();

    // const canvasElement = document.getElementById("canvas");
    // canvasElement?.removeChild(board.app.view);

    // const playButton: HTMLObjectElement | null = document.querySelector("#play");
    // if (playButton)
    //     playButton.removeEventListener("click", () => startGame());
}

function gameLoop(delta: number): void {
    if (isPlaying) {
        frames++;
        board.update();
    }
}

function startGame() {

    console.log("START GAME");

    reset();

    updateLevel(1);
    updateHealth(board.player.health);

    const gamePlayerButton = document.getElementById("game_ready-button");
    if (gamePlayerButton) {
        // gamePlayerButton.classList.add(`player${thisPlayer}`);
        gamePlayerButton.addEventListener('click', () => {
            if (currentPlayer === thisPlayer) {
                console.log("Player clicked");
                const playData: IPlayData = {
                    position: {
                        x: 1,
                        y: 2
                    },
                    direction: {
                        x: 3,
                        y: 4
                    }
                };
                changePlayer(playData)
                gameRoomController.doGameFocusLeave(playData)
            }
        })
    }

    const gamePlayerLabel = document.getElementById("game_ready-player");
    if (gamePlayerLabel)
        gamePlayerLabel.innerText = `Player ${thisPlayer}`;

    if (thisPlayer === 1) {
        changePlayer1();
    }
    else {
        changePlayer2();
    }

    isPlaying = true;
    setupControls();

    startFps();

    board.app.ticker.add(gameLoop);
    board.app.ticker.start();
}

function startFps() {
    fpsInterval = setInterval(() => {   
        const fps = frames;
        frames = 0;
    
        const framesElement = document.querySelector('#fps span');
        if (framesElement) 
            framesElement.innerHTML = fps.toString();

        console.log("fps", board.app.ticker.FPS, board.app.ticker.minFPS, board.app.ticker.maxFPS);

    }, 1000);
}

function endFps() {
    clearInterval(fpsInterval);
}




/* UI STUFF */

const hideElement = (selector: string) => {
    const element = document.getElementById(selector);
    element?.classList.add('hidden');
}

const showElement = (selector:string) => {
    const element = document.getElementById(selector);
    element?.classList.remove('hidden');
}

const transitionState = (nextState: string, preTransition:() => void = () => {}, postTransition:() => void = () => {}) => {
    preTransition();

    hideElement('state-' + currentState);
    showElement('state-' + nextState);
    currentState = nextState;

    postTransition();
}

/* END UI STUFF */

// enum UI_STATES {
//     INITIALIZING,
//     INITIALIZED,
//     CONNECTING_TO_SERVER,
//     CONNECTED_TO_SERVER,
//     CHOOSING_GAME_ROOM,
//     CHOSE_GAME_ROOM,
//     WAITING_FOR_PLAYER,
//     FOUND_PLAYER,
//     WAITING_TO_START_GAME,
//     READY_TO_START_GAME,
//     PLAYING_GAME,
//     GAME_OVER
// }

// const validStateTransition = new Map<UI_STATES, UI_STATES[]>();
// validStateTransition.set(UI_STATES.INITIALIZING, [UI_STATES.INITIALIZED]);
// validStateTransition.set(UI_STATES.INITIALIZED, [UI_STATES.INITIALIZING, UI_STATES.CONNECTING_TO_SERVER]);
// validStateTransition.set(UI_STATES.CONNECTING_TO_SERVER, [UI_STATES.INITIALIZED, UI_STATES.CONNECTED_TO_SERVER]);
// validStateTransition.set(UI_STATES.CONNECTED_TO_SERVER, [UI_STATES.INITIALIZED, UI_STATES.CONNECTING_TO_SERVER, UI_STATES.CHOOSING_GAME_ROOM]);

/* TRANSITION STUFF */

/* END TRANSITION STUFF */

// const setIsConnected = (isConnected: boolean) => {
//     console.log("Setting is connected: ", isConnected);
// }

// const setSocket = (socket: Socket) => {
//     console.log("Setting socket: ", socket);
//     thisSocket = socket;
// }

const connectSocket = async () => {
    const url = process.env.SOCKET_SERVER_URL;
    if (!url) {
        console.log("No url provided!");
        return;
    }

    const isConnected = () => {
        console.log("Firing index isConnected()");

        transitionState("game_room_selector");
    };

    const isReConnected = () => {
        console.log("Firing index isReConnected()");

        // transitionState("game_room_selector");
    };
    
    const isDisconnected = (e: any) => {
        console.log("Firing index isDisconnected", e);

        transitionState(
            "waiting_connect",
            destroyGameObjects
        );
    }

    const networkService = SocketService.Instance;
    gameRoomController = new SocketGameRoomController(url, networkService);
    gameRoomController.onConnected(isConnected);
    gameRoomController.onReConnected(isReConnected);
    gameRoomController.onDisconnected(isDisconnected);
    gameRoomController.connect();



    // const socketService = SocketService.Instance;
    // socketService.onConnected = isConnected;
    // socketService.onDisconnected = isDisconnected;
    // await socketService.connect(url)
    // .then((socket) => {
    //     console.log("Completed connecting to " + url);

    //     transitionState(
    //         "game_room_selector",
    //         () => setSocket(socket)
    //     );

    // })
    // .catch((err) => {
    //     console.log("Error connecting:", err);
    // });
};

const changePlayer = (playData: IPlayData) => {
    
    currentPlayer = (currentPlayer === 1) ? 2 : 1;


    if (currentPlayer === 1) {
        changePlayer1();
    }
    else {
        changePlayer2();
    }
}

const changePlayer1 = () => {
    const playerLabel = document.getElementById("game_ready-current_player");
    if (playerLabel)
        playerLabel.innerText = "Turn: Player 1";    
    
    const gameButton = document.getElementById("game_ready-button");
    if (gameButton) {
        gameButton.classList.remove("player2");
        gameButton.classList.add("player1");
    }
}

const changePlayer2 = () => {
    const playerLabel = document.getElementById("game_ready-current_player");
    if (playerLabel)
        playerLabel.innerText = "Turn: Player 2";    
    
    const gameButton = document.getElementById("game_ready-button");
    if (gameButton) {
        gameButton.classList.remove("player1");
        gameButton.classList.add("player2");
    }
}

const handleBoardIsAPlay = () => {
    // GameService.Instance.
}

const joinRoom = async (e: MouseEvent) => {
    e.preventDefault();

    const gameRoomNameInput: HTMLInputElement | null = document.getElementById("game_room_selector-room_name") as HTMLInputElement | null;
    if (gameRoomNameInput) {
        const gameRoomName = gameRoomNameInput.value

        if (gameRoomName) {
            gameRoomController.onStartGame((options: IStartGame) => {
                console.log("Firing onStartGame()");
                thisPlayer = options.player;
                currentPlayer = 1 // TODO: this needs to be controller server side
                console.log("starting as player", thisPlayer);
                transitionState(
                    "game_ready",
                    () => {},
                    () => {
                        gameRoomController.onGameFocusEnter((playData) => changePlayer(playData));
                        initGameObjects();
                        startGame();
                    }
                );
            });

            gameRoomController.onRoomReadyToStartGame((roomId: string) => {
                console.log("The room is ready!", roomId);
            });

            await gameRoomController
            .joinGameRoom(gameRoomName)
            .then((joined) => {
                if (joined) {
                    transitionState(
                        "game_room_waiting"
                    );
                }
            })
            .catch((err) => {
                alert(err + ", Room Name: " + gameRoomName);
            });
        }
    }
};

const gameRoomSelectorButton: HTMLElement | null = document.getElementById("game_room_selector-join_room");
if (gameRoomSelectorButton)
    gameRoomSelectorButton.addEventListener("click", joinRoom);

let score: number;
let level: number;
let combo: number;
let isPlaying = false;
let controls: Controls;
let board: Board;
let frames: number = 0;
let fpsInterval: NodeJS.Timer;
// let thisSocket: Socket;
let gameRoomController: SocketGameRoomController;
connectSocket();
let currentState = "waiting_connect";
let thisPlayer: number;
let currentPlayer: number;

const playButton: HTMLObjectElement | null = document.querySelector("#addMonster");
if (playButton)
    playButton.addEventListener("click", () => board.addMonster());


const gameButton = document.getElementById("game_ready-button");
if (gameButton)
    gameButton.addEventListener("click", () => handleBoardIsAPlay());


// console.log("TEST");
// let func1 = () => "1";
// const func2 = () => func1;
// const func3 = () => func1();
// const func4 = (func: Function) => func;
// const func5 = (func: Function) => func();

// console.log("Output 1");
// console.log(func1());

// console.log("Output 2");
// console.log(func2());

// console.log("Output 3");
// console.log(func3());

// console.log("Output 4.1");
// console.log(func4(func1));

// console.log("Output 4.2");
// console.log(func4(func2));

// console.log("Output 4.3");
// console.log(func4(func3));

// console.log("Output 5.1");
// console.log(func5(func1));

// console.log("Output 5.2");
// console.log(func5(func2));

// console.log("Output 5.3");
// console.log(func5(func3));

// console.log("");

// func1 = () => "2";

// console.log("Output 1");
// console.log(func1());

// console.log("Output 2");
// console.log(func2());

// console.log("Output 3");
// console.log(func3());

// console.log("Output 4.1");
// console.log(func4(func1));

// console.log("Output 4.2");
// console.log(func4(func2));

// console.log("Output 4.3");
// console.log(func4(func3));

// console.log("Output 5.1");
// console.log(func5(func1));

// console.log("Output 5.2");
// console.log(func5(func2));

// console.log("Output 5.3");
// console.log(func5(func3));

// console.log("");