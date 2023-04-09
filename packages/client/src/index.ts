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
import { GameStateStatus, GAME_CONSTANTS, IGameRoomState, IPlayData, IPlayerState, IRoomState, IScoreData, IStartGame, Vector, teamTypes} from '@interpong/common';
import { IGameRoomController, SocketGameRoomController } from './controllers/';
import { GAME_EVENTS } from '@interpong/common';
import { SoloMovementEvents, SpriteActions } from './sprites/events';
import { TransferTypes } from './sprites/TransferBall';
import RectanglePlayer from './sprites/RectanglePlayer';
import UpDownMoveStrategy from './strategies/UpDownMoveStrategy';
import { Sprite, TextureMatrix } from 'pixi.js';
import { GAME_SCORE_EVENTS } from '@interpong/common';
import MockGameRoomController from './controllers/__mocks__/MockGameRoomController';



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
    if ((thisPlayerNumber === 1 && movementEvent.includes(SoloMovementEvents.TRANSFERRED_RIGHT_WALL)) ||
        (thisPlayerNumber === 2 && movementEvent.includes(SoloMovementEvents.TRANSFERRED_LEFT_WALL))) {

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
    if ((thisPlayerNumber === 1 && movementEvent.includes(SoloMovementEvents.HIT_LEFT_WALL)) ||
        (thisPlayerNumber === 2 && movementEvent.includes(SoloMovementEvents.HIT_RIGHT_WALL))) {

        const scoreDiff = DEFAULTS.score.increment;
        const newScore = score + scoreDiff;
        const scoreData: IScoreData = {
            player: thisPlayerNumber,
            currentScore: score,
            event: GAME_SCORE_EVENTS.WALL_HIT
        }
        gameRoomController.doGameScoreChange(scoreData);
        // updateScore(newScore);
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

const handleScoreChange = (gameRoomState: IGameRoomState) => {
    const thisPlayerState = gameRoomState.players.find(p => p.playerNumber === thisPlayerNumber);

    if (!thisPlayerState) {
        throw new Error(`Player state for player ${thisPlayerNumber} unexpectedly undefined`);
    }

    updateScore(thisPlayerState.score);

    updatePlayers(gameRoomState);

}

const makeIncomingBall = (position: Vector, direction: Vector) => {
    const newDirection = {
        x: direction.x,
        y: direction.y
    };
    const newPosition = {
        x: thisPlayerNumber === 1 ? 532 : -20,
        y: position.y
    }
    const exitSide: TransferTypes = thisPlayerNumber === 1 ? "right" : "left";

    console.log("About to enter a new ball", newPosition, newDirection);
    const ball = new TransferBall(0x22dd22, 20, newDirection, newPosition, [exitSide] );
    board.addNewBall(ball);
}

const makeTestBall = (position: Vector, direction: Vector) => {
    const exitSide: TransferTypes = thisPlayerNumber === 1 ? "right" : "left";

    console.log("About to enter a new ball", position, direction);
    const ball = new BouncingBall(0xff2222, 20, direction, position);
    // const ball = new TransferBall(0xff2222, 20, direction, position, ["right"]);
    board.addNewBall(ball);
}

function initGameObjects() {
    const player = new RectanglePlayer(
        0xfcf8ec,
        DEFAULTS.player.width,
        DEFAULTS.player.height,
        {x:DEFAULTS.player.direction.x, y:DEFAULTS.player.direction.y},
        {
            x: thisPlayerNumber === 1 ?
                DEFAULTS.player.startPos.x : 
                DEFAULTS.width - DEFAULTS.player.startPos.x - DEFAULTS.player.width,
            y: DEFAULTS.player.startPos.y
        },
        new UpDownMoveStrategy(),
        new SimpleSpeedStrategy(),
        new SimpleHealthStrategy());
    // const coin = new Coin(0xfcf8ec, 10, {x:0, y:0}, {x:0, y:0});
    // const ball = new BouncingBall(0xe42e2e, 20, {x:6, y:7}, {x:0, y:0});

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
        // ball,
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

    // const playButton: HTMLObjectElement | null = document.querySelector("#play");
    // if (playButton)
    //     playButton.addEventListener("click", () => startGame());

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

function updatePlayers(gameRoomState: IGameRoomState) {
    // const playersElement = document.getElementById("game_ready-players")
    // if (playersElement) {
    //     const sortedPlayers = gameRoomState.players.sort((a, b) => a.score - b.score);
    //     for (let i = 0; i < sortedPlayers.length; i++) {
    //         const player = sortedPlayers[i];
    //         const playerElementId = `players-socket-${player.id}`
    //         let div = document.getElementById(playerElementId);
    //         if (!div) {
    //             div = document.createElement("div");
    //             div.id = playerElementId;
    //             div.classList.add("player");
    //             div.innerText = `Player ${player.playerNumber} ${thisPlayerNumber === player.playerNumber ? '(you)' : ''}`;
    //         }

    //         let span = div.firstElementChild as HTMLElement;
    //         if (!span) {
    //             span = document.createElement("span");
    //             div.append(span);
    //         }
    //         span.innerText = `${player.score.toLocaleString()}`;

    //         playersElement.prepend(div);

    //         if (player.playerNumber === thisPlayerNumber) {
    //             // TODO: reconcile when local score data is different from server score data
    //         }
    //     }


        for (let teamType of teamTypes) {
            const teamElement = document.getElementById(`game_ready-teams_${teamType}_players`);
            if (teamElement) {
                const players = gameRoomState.players.filter(p => p.team === teamType).sort((a, b) => a.score = b.score);
                for (let i = 0; i < players.length; i++) {
                    const player = players[i];
                    const playerElementId = `players-${teamType}-socket-${player.id}`
                    let div = document.getElementById(playerElementId);
                    if (!div) {
                        div = document.createElement("div");
                        div.id = playerElementId;
                        div.classList.add("team-player");
                        div.innerText = `Player ${player.playerNumber} ${thisPlayerNumber === player.playerNumber ? '(you)' : ''}`;
                    }

                    let span = div.firstElementChild as HTMLElement;
                    if (!span) {
                        span = document.createElement("span");
                        div.append(span);
                    }
                    span.innerText = `${player.score.toLocaleString()}`;

                    teamElement.prepend(div);

                    if (player.playerNumber === thisPlayerNumber) {
                        // TODO: reconcile when local score data is different from server score data
                    }
                }

                const teamScore = players.map(p => p.score).reduce((s, acc = 0) => acc + s);
                const teamScoreElement = document.getElementById(`game_ready-teams_${teamType}_score`);
                if (teamScoreElement) {
                    teamScoreElement.innerText = teamScore.toLocaleString();
                }
            }
        }
    // }
}

function startGame(addBall: boolean) {

    console.log("START GAME");

    reset();

    // updateLevel(1);
    // updateHealth(board.player.health);

    // const gamePlayerLabel = document.getElementById("game_ready-player");
    // if (gamePlayerLabel)
    //     gamePlayerLabel.innerText = `Player ${thisPlayer}`;

    // if (thisPlayer === 1) {
    //     changePlayer1();
    // }
    // else {
    //     changePlayer2();
    // }
    // end temporary player objects

    isPlaying = true;
    setupControls();

    startFps();

    // const ball = thisPlayerNumber === 1 ? new TransferBall(0x22dd22, 20, ballDirection, ballPosition, ["right"] ) : undefined;
    // console.log("Just created a new ball", ball ? ballPosition : undefined, ball ? ballDirection : undefined );


    // if (ball)
    //     board.addNewBall(ball);

    if (addBall) {
        const xPos = thisPlayerNumber === 1 ? 532 : -20;
        const yPos = Math.random() * 512;
        const ballPosition: Vector = {x: xPos, y: yPos};

        const xDir = thisPlayerNumber === 1 ? -4 : 4;
        const yDir = 3.15;
        const ballDirection: Vector = {x: xDir, y: yDir};
        makeIncomingBall(ballPosition, ballDirection);
    }

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
    
    currentPlayerNumber = (currentPlayerNumber === 1) ? 2 : 1;

    if (currentPlayerNumber === 1) {
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

const handleRoomListUpdate = (roomStates: IRoomState[]) => {
    const roomsElement = document.getElementById("game_room_selector-room_list")
    if (roomsElement) {
        const noneRoomsElement = roomsElement.firstElementChild;
        if (!roomStates || roomStates.length <= 0) {
            noneRoomsElement?.classList.remove("hidden");
        }
        else {
            noneRoomsElement?.classList.add("hidden");

            // TODO: need to handle when a room goes away in between renders, the div will remain
            const sortedRooms = roomStates.sort((a, b) => ('' + b.roomId).localeCompare(a.roomId));
            for (let i = 0; i < sortedRooms.length; i++) {
                const room = sortedRooms[i];
                // TODO: display the room name instead of using the room id
                const roomElementId = `room-socket-${room.roomId}`
                let div = document.getElementById(roomElementId);
                if (!div) {
                    div = document.createElement("div");
                    div.id = roomElementId;
                    div.classList.add("room");
                }

                let roomSpan = div.firstElementChild as HTMLElement;
                if (!roomSpan) {
                    roomSpan = document.createElement("span");
                    roomSpan.classList.add("room_id_label");
                    roomSpan.innerText = `${room.roomId}`;
                    div.append(roomSpan);
                }

                let span = roomSpan.nextElementSibling as HTMLElement;
                if (!span) {
                    span = document.createElement("span");
                    span.classList.add("room_number_players");
                    div.append(span);
                }
                span.innerText = `${room.numberOfPlayers}/${room.maxNumberOfPlayers}`;

                let button = span.nextElementSibling as HTMLElement;
                if (!button) {
                    button = document.createElement("button");
                    button.innerText = "Join"
                    button.classList.add("room_join_button");
                    button.addEventListener("click", (e: MouseEvent) => {
                        e.preventDefault();
                        joinRoom(room.roomId);
                    })
                    span.insertAdjacentElement("afterend", button);
                }

                roomsElement.prepend(div);
            }
        }
    }
}

const connectToServer = async () => {
    const url = process.env.SOCKET_SERVER_URL;
    if (!url) {
        console.log("No url provided!");
        return;
    }

    const isConnected = () => {
        console.log("Firing index isConnected()");

        gameRoomController.onRoomsUpdate(handleRoomListUpdate);
        
        transitionState(
            "game_room_selector",
            () => {
                const gameRoomSelectorButton: HTMLElement | null = document.getElementById("game_room_selector-join_room");
                if (gameRoomSelectorButton)
                    gameRoomSelectorButton.addEventListener("click", handleJoinRoom);
            },
            () => {
                gameRoomController.doGetRooms();
                // setTimeout(() => {
                //     joinRoom("auto_join_room");
                // }, 200);
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

const joinRoom = async (roomName: string) => {
    console.log("About to join room", roomName);
    if (roomName) {
        gameRoomController.onStartGame((startGameData: IStartGame) => {
            // TODO: There is a bug where the gameboard gets shown every time this is called, creating multiple visible gameboards.
            console.log("Firing onStartGame()");
            console.log(startGameData);
            thisPlayerNumber = startGameData.player.playerNumber;
            currentPlayerNumber = startGameData.state.game.currentPlayer?.playerNumber;
            console.log("starting as player", thisPlayerNumber);
            transitionState(
                "game_ready",
                () => {},
                () => {
                    gameRoomController.onGameFocusEnter((playData) => {
                        console.log("Making a ball from onGameFocusEnter", playData);
                        makeIncomingBall(playData.position, playData.direction);
                    });
                    gameRoomController.onGameScoreChange((gameRoomState) => {
                        handleScoreChange(gameRoomState);
                    });
                    initGameObjects();
                    startGame(startGameData.enterBall);

                    updatePlayers(startGameData.state);
                }
            );
        });

        gameRoomController.onRoomReadyToStartGame((roomState: IRoomState) => {
            console.log("The room is ready!", roomState.roomId);
        });

        await gameRoomController
        .joinGameRoom(roomName)
        .then((joined) => {
            if (joined) {
                transitionState(
                    "game_room_waiting",
                    () => {},
                    () => {
                        // TODO: there is a bug here.  Need a graceful way to get the room name vs. id, and intelligently swap between them
                        const roomLabel = document.getElementById("state-game_room_waiting-room_label");
                        if (roomLabel) {
                            roomLabel.innerText = `Room name: ${roomName}`;
                        }

                        const gameRoomLabel = document.getElementById("room");
                        if (gameRoomLabel) {
                            gameRoomLabel.innerText = `Room name: ${roomName}`;
                        }
                    }
                );
            }
        })
        .catch((err) => {
            alert(err + ", Room Name: " + roomName);
        });
    }
};

const handleJoinRoom = (e: MouseEvent) => {
    e.preventDefault();

    const gameRoomNameInput: HTMLInputElement | null = document.getElementById("game_room_selector-room_name") as HTMLInputElement | null;
    if (gameRoomNameInput) {
        const gameRoomName = gameRoomNameInput.value

        if (gameRoomName) {
            joinRoom(gameRoomName);
        }
    }
}

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

let gameRoomController: IGameRoomController<Socket>;
let currentState: TransitionStates = "waiting_connect";
let thisPlayerNumber: number;
let currentPlayerNumber: number | undefined;

/* END GLOBALS */

const testGame = false;

if (!testGame) connectToServer();

// Dummy in the game board
if (testGame) transitionState(
    "game_ready",
    () => { 
        thisPlayerNumber = 1;
        gameRoomController = new MockGameRoomController();
        gameRoomController.connect();
        gameRoomController.onGameScoreChange((gameRoomState) => {
            handleScoreChange(gameRoomState);
        });
        initGameObjects();
        startGame(false);
        const yPos = Math.random() * 512;
        const yDir = ((Math.random() < 0.5) ? -1 : 1) * 3.15;
        makeTestBall({x: 480, y: yPos}, {x: -4, y: yDir});

        const player1: IPlayerState = {
            id: "ABCD",
            playerNumber: 1,
            team: "left",
            score: 0
        };
        const player2: IPlayerState = {
            id: "ZYXW",
            playerNumber: 2,
            team: "right",
            score: 50
        };
        const players: IPlayerState[] = [];
        players.push(player1);
        players.push(player2);
        const gameRoomState: IGameRoomState = {
            players: players,
            game: {
                currentPlayer: player1,
                status: GameStateStatus.GAME_STARTED
            }
        }
        updatePlayers(gameRoomState);

    }
);

// const element = document.getElementById("jesstest");
// if (element) {
//     const div1 = document.createElement("div");
//     div1.id = "div-jesstest1";
//     div1.innerText = "test1";

//     const span1 = document.createElement("span");
//     span1.innerText = "---my span1";
//     div1.appendChild(span1);
//     element.appendChild(div1);  
    
//     const div2 = document.createElement("div");
//     div2.id = "div-jesstest2";
//     div2.innerText = "test2";

//     const span2 = document.createElement("span");
//     span2.innerText = "---my span2";
//     div2.appendChild(span2);
//     element.appendChild(div2);
    
//     const div3 = document.createElement("div");
//     div3.id = "div-jesstest3";
//     div3.innerText = "test3";

//     const span3 = document.createElement("span");
//     span3.innerText = "---my span3";
//     div3.appendChild(span3);
//     element.appendChild(div3);

//     for (let i = 1; i <= 6; i++) {
//         let div = document.getElementById("div-jesstest" + i);
//         if (!div) {
//             div = document.createElement("div");
//             div.id = "div-jesstest" + i;
//             div.innerText = "test LOOP " + i;
//             element.appendChild(div);
//         }

//         let span = div.firstElementChild as HTMLElement;
//         if (!span) {
//             span = document.createElement("span");
//             div.appendChild(span);
//         }
//         span.innerText = "---my span LOOP" + i;

//     }

//     const parent = document.getElementById("jesstest");
//     if (parent) {
//         const toMove = (document.getElementById("div-jesstest4") as HTMLElement);
//         let ref = document.getElementById("div-jesstest2");

//         parent.insertBefore(toMove, ref);
//     }
// }