import * as PIXI from 'pixi.js';
import { DEFAULTS } from './constants';
import Controls from './Controls';
import SimpleMoveStrategy from './strategies/SimpleMoveStrategy';
import { Player, Coin, Monster, BouncingBall, TransferBall } from './sprites';
import { BasicBoard, BasicBoardProps } from './View/BasicBoard';
import SimpleSpeedStrategy from './strategies/SimpleSpeedStrategy';
import { SimpleHealthStrategy } from './strategies/SimpleHealthStrategy';
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { SocketService } from "./services";
import { start } from 'repl';
import { IPlayData, IScoreData, IStartGame, Vector } from '@interpong/common';
import { SocketGameRoomController } from './controllers/';
import { GAME_EVENTS } from '@interpong/common';
import { SoloMovementEvents, SpriteActions } from './sprites/events';
import { TransferTypes } from './sprites/TransferBall';
import RectanglePlayer from './sprites/RectanglePlayer';
import UpDownMoveStrategy from './strategies/UpDownMoveStrategy';
import { Sprite } from 'pixi.js';



// function shake(app: PIXI.Application, className: string) {
//     return;

//    app.view.className = className;
//    setTimeout(()=>{app.view.className = ""}, 50);
// }

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

const ballMovementEventDestroyOnExit = (movementEvent: SoloMovementEvents[], position: Vector, direction: Vector): SpriteActions[] => {
    if ((thisPlayer === 1 && movementEvent.includes(SoloMovementEvents.TRANSFERRED_RIGHT_WALL)) ||
        (thisPlayer === 2 && movementEvent.includes(SoloMovementEvents.TRANSFERRED_LEFT_WALL))) {

        console.log("Transferred", position, direction);

        const playData: IPlayData = {position, direction};
        gameRoomController.doGameFocusLeave(playData);

        // setTimeout(() => {
        //     makeIncomingBall(position, direction);
        // }, 1);

        const actions: SpriteActions[] = [];
        actions.push(SpriteActions.DESTROY);
        return [...actions];
    }

    return [];
}

const ballMovementEventScoreOtherPlayer = (movementEvent: SoloMovementEvents[], position: Vector, direction: Vector): SpriteActions[] => {
    if ((thisPlayer === 1 && movementEvent.includes(SoloMovementEvents.HIT_LEFT_WALL)) ||
        (thisPlayer === 2 && movementEvent.includes(SoloMovementEvents.HIT_RIGHT_WALL))) {

        const scoreDiff = DEFAULTS.score.increment;
        const newScore = score + scoreDiff;
        const scoreData: IScoreData = {
            player: thisPlayer,
            score: newScore,
            scoreDiff: scoreDiff
        }
        gameRoomController.doGameScoreChange(scoreData);
        updateScore(newScore);
    }

    return [];
}



const ballMovementEvents = (movementEvent: SoloMovementEvents[], position: Vector, direction: Vector): SpriteActions[] => {
    let actions: SpriteActions[] = [];


    if (movementEvent.includes(SoloMovementEvents.TRANSFERRED_RIGHT_WALL) || movementEvent.includes(SoloMovementEvents.TRANSFERRED_LEFT_WALL)) {
        const newActions = ballMovementEventDestroyOnExit(movementEvent, position, direction)
        actions = [...newActions];
    }
    else if (movementEvent.includes(SoloMovementEvents.HIT_LEFT_WALL) || movementEvent.includes(SoloMovementEvents.HIT_RIGHT_WALL)) {
        actions = [...(ballMovementEventScoreOtherPlayer(movementEvent, position, direction))];
    }

    return actions;
}

const handleScoreChange = (scoreData: IScoreData) => {
    updateScore(score + scoreData.scoreDiff);
}

const makeIncomingBall = (position: Vector, direction: Vector) => {
    const newDirection = {
        x: direction.x,
        y: direction.y
    };
    const newPosition = {
        x: thisPlayer === 1 ? 532 : -20,
        y: position.y
    }
    const exitSide: TransferTypes = thisPlayer === 1 ? "right" : "left";

    console.log("About to enter a new ball", newPosition, newDirection);
    const ball = new TransferBall(0x22dd22, 20, newDirection, newPosition, [exitSide] );
    board.addNewBall(ball);
}

const makeTestBall = (position: Vector, direction: Vector) => {
    const exitSide: TransferTypes = thisPlayer === 1 ? "right" : "left";

    console.log("About to enter a new ball", position, direction);
    // const ball = new BouncingBall(0xff2222, 20, direction, position);
    const ball = new TransferBall(0xff2222, 20, direction, position, ["right"]);
    board.addNewBall(ball);
}

function initGameObjects() {
    const player = new RectanglePlayer(
        0xfcf8ec,
        DEFAULTS.player.width,
        DEFAULTS.player.height,
        {x:DEFAULTS.player.direction.x, y:DEFAULTS.player.direction.y},
        {
            x: thisPlayer === 1 ?
                DEFAULTS.player.startPos.x : 
                DEFAULTS.width - DEFAULTS.player.startPos.x - DEFAULTS.player.width,
            y: DEFAULTS.player.startPos.y
        },
        new UpDownMoveStrategy(),
        new SimpleSpeedStrategy(),
        new SimpleHealthStrategy());
    // const coin = new Coin(0xfcf8ec, 10, {x:0, y:0}, {x:0, y:0});
    // const ball = new BouncingBall(0xe42e2e, 20, {x:6, y:7}, {x:0, y:0});
    const ball = thisPlayer === 1 ? new TransferBall(0xff2222, 20, {x: -4, y: 3}, {x: 480, y: 200}, ["right"] ) : undefined;
    // const monsters: Monster[] = [];
    controls = new Controls(
        (e) => onkeydown(e, player),
        (e) => onkeyup(e, player)
    );

    const boardProps: BasicBoardProps = {
        width: DEFAULTS.width,
        height: DEFAULTS.height,
        backgroundColor: 0x456268,
        player,
        // coin,
        // monsters,
        ball,
        // onPlayerCollideWithMonster: playerCollideWithMonster,
        // onPlayerCollideWithCoin: playerCollideWithCoin,
        onMovementEvent: ballMovementEvents
    }
    board = new BasicBoard(boardProps);
    //board.app.ticker.add((delta) => console.log("tick"));

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

    // Temporary player objects to validate socket connectivity
    // const gamePlayerButton = document.getElementById("game_ready-button");
    // if (gamePlayerButton)
    //     gamePlayerButton.addEventListener("click", () => handleBoardIsAPlay());

    const gamePlayerLabel = document.getElementById("game_ready-player");
    if (gamePlayerLabel)
        gamePlayerLabel.innerText = `Player ${thisPlayer}`;

    if (thisPlayer === 1) {
        changePlayer1();
    }
    else {
        changePlayer2();
    }
    // end temporary player objects

    isPlaying = true;
    setupControls();

    startFps();

    // board.addMonster();
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

        // console.log("fps", board.app.ticker.FPS, board.app.ticker.minFPS, board.app.ticker.maxFPS);

    }, 1000);
}

function endFps() {
    clearInterval(fpsInterval);
}

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

// const handleBoardIsAPlay = () => {
//     if (currentPlayer === thisPlayer) {
//         console.log("Player clicked");
//         const playData: IPlayData = {
//             position: {
//                 x: 1,
//                 y: 2
//             },
//             direction: {
//                 x: 3,
//                 y: 4
//             }
//         };
//         changePlayer(playData)
//         gameRoomController.doGameFocusLeave(playData)
//     }
// }




/* UI STUFF */

const hideElement = (selector: string) => {
    const element = document.getElementById(selector);
    element?.classList.add('hidden');
}

const showElement = (selector:string) => {
    const element = document.getElementById(selector);
    element?.classList.remove('hidden');
}

const transitionState = (nextState: TransitionStates, preTransition:() => void = () => {}, postTransition:() => void = () => {}) => {
    preTransition();

    hideElement('state-' + currentState);
    showElement('state-' + nextState);
    currentState = nextState;

    postTransition();
}

/* END UI STUFF */

/* GAME ROOM CONNECTIVITY */

const connectToServer = async () => {
    const url = process.env.SOCKET_SERVER_URL;
    if (!url) {
        console.log("No url provided!");
        return;
    }

    const isConnected = () => {
        console.log("Firing index isConnected()");

        transitionState(
            "game_room_selector",
            () => {
                const gameRoomSelectorButton: HTMLElement | null = document.getElementById("game_room_selector-join_room");
                if (gameRoomSelectorButton)
                    gameRoomSelectorButton.addEventListener("click", joinRoom);
            }
        );
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

    const networkService = SocketService.Instance; // TODO: move this to dependency injection
    gameRoomController = new SocketGameRoomController(url, networkService);
    gameRoomController.onConnected(isConnected);
    gameRoomController.onReConnected(isReConnected);
    gameRoomController.onDisconnected(isDisconnected);
    gameRoomController.connect();
};

const joinRoom = async (e: MouseEvent) => {
    e.preventDefault();

    const gameRoomNameInput: HTMLInputElement | null = document.getElementById("game_room_selector-room_name") as HTMLInputElement | null;
    if (gameRoomNameInput) {
        const gameRoomName = gameRoomNameInput.value

        if (gameRoomName) {
            gameRoomController.onStartGame((options: IStartGame) => {
                console.log("Firing onStartGame()");
                thisPlayer = options.player;
                currentPlayer = 1 // TODO: this needs to be controlled server side
                console.log("starting as player", thisPlayer);
                transitionState(
                    "game_ready",
                    () => {},
                    () => {
                        gameRoomController.onGameFocusEnter((playData) => {
                            console.log("Received game focus event from server");
                            makeIncomingBall(playData.position, playData.direction);
                        });
                        gameRoomController.onGameScoreChange((scoreData) => {
                            console.log("Received game score event from server");
                            handleScoreChange(scoreData);
                        });
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

/* END GAME ROOM CONNECTIVITY */


/* SETUP GLOBALS */ 

type TransitionStates = "waiting_connect" | "game_room_selector" | "game_room_waiting" | "game_ready";

let score: number;
let level: number;
let combo: number;
let isPlaying = false;
let controls: Controls;
let board: BasicBoard;
let frames: number = 0;
let fpsInterval: NodeJS.Timer;

let gameRoomController: SocketGameRoomController;
let currentState: TransitionStates = "waiting_connect";
let thisPlayer: number;
let currentPlayer: number;

/* END GLOBALS */

connectToServer();

// Dummy in the game board
// transitionState(
//     "game_ready",
//     () => { 
//         thisPlayer = 1;
//         initGameObjects();
//         startGame();
//         makeTestBall({x: 480, y: 200}, {x: -4, y: 3});
//     }
// );

// const playButton: HTMLObjectElement | null = document.querySelector("#addMonster");
// if (playButton)
//     playButton.addEventListener("click", () => board.addMonster());
