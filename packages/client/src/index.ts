import Controls from './Controls';
import { RectanglePlayer, BouncingBall, TransferBall, BallType, PlayerType } from './sprites';
import { BasicBoard, BasicBoardProps } from './View/BasicBoard';
import SimpleSpeedStrategy from './strategies/SimpleSpeedStrategy';
import { SimpleHealthStrategy } from './strategies/SimpleHealthStrategy';
import { Socket } from "socket.io-client";
import { SocketService } from "./services";
import { IGameRoomState, IRoomState, IScoreData, IStartGame, IBallState, DEFAULTS, IBallUpdateState, mockGameRoomState, TeamType} from '@interpong/common';
import { IGameRoomController, SocketGameRoomController } from './controllers/';
import { SoloMovementEvents, SpriteActions } from './sprites/events';
import { TransferTypes } from './sprites/TransferBall';
import UpDownMoveStrategy from './strategies/UpDownMoveStrategy';
import { GAME_SCORE_EVENTS } from '@interpong/common';
import MockGameRoomController from './controllers/__mocks__/MockGameRoomController';




function onkeydown(ev: KeyboardEvent, player: PlayerType) {
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
function onkeyup(ev: KeyboardEvent, player: PlayerType) {
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

const ballMovementEventDestroyOnExit = (movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[] => {
    if ((thisPlayerNumber === 1 && movementEvent.includes(SoloMovementEvents.TRANSFERRED_RIGHT_WALL)) ||
        (thisPlayerNumber === 2 && movementEvent.includes(SoloMovementEvents.TRANSFERRED_LEFT_WALL))) {

        console.log("Transferred", ball.center, ball.v);

        // const playData: IPlayData = {id: ball.ballId, position: ball.center, direction: ball.v};
        // gameRoomController.doGameFocusLeave(playData);

        const ballState: IBallUpdateState = {
            id: ball.ballId,
            lastPosition: ball.center,
            lastDirection: ball.v
        }
        gameRoomController.doGameBallLeaveBoard(ballState);

        const actions: SpriteActions[] = [];
        actions.push(SpriteActions.DESTROY);
        return [...actions];
    }

    return [];
}

const ballMovementEventScoreOtherPlayer = (movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[] => {
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



const ballMovementEvents = (movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[] => {
    let actions: SpriteActions[] = [];


    if (movementEvent.includes(SoloMovementEvents.TRANSFERRED_RIGHT_WALL) || movementEvent.includes(SoloMovementEvents.TRANSFERRED_LEFT_WALL)) {
        const newActions = ballMovementEventDestroyOnExit(movementEvent, ball)
        actions = [...newActions];
    }
    else if (movementEvent.includes(SoloMovementEvents.HIT_LEFT_WALL) || movementEvent.includes(SoloMovementEvents.HIT_RIGHT_WALL)) {
        actions = [...(ballMovementEventScoreOtherPlayer(movementEvent, ball))];
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

// const makeIncomingBall = (position: Vector, direction: Vector) => {
const makeIncomingBall = (ball: IBallState) => {
    const exitSide: TransferTypes = thisPlayerNumber === 1 ? "right" : "left"; // TODO: this can be driven by team

    console.log("About to enter a new ball", ball.lastPosition, ball.lastDirection);
    ballsInPlay.push({...ball});
    const ballSprite = new TransferBall(ball.color, DEFAULTS.ball.radius, ball.lastDirection, ball.lastPosition, ball.id, [exitSide]);
    board.addNewBall(ballSprite);
}

const makeTestBall = (ball: IBallState) => {
    const exitSide: TransferTypes = thisPlayerNumber === 1 ? "right" : "left";

    console.log("About to enter a new test ball", ball.lastPosition, ball.lastDirection);
    const ballSprite = new BouncingBall(ball.color, DEFAULTS.ball.radius, ball.lastDirection, ball.lastPosition, ball.id);
    // const ball = new TransferBall(0xff2222, DEFAULTS.ball.radius, direction, position, "mytestball", ["right"]);
    board.addNewBall(ballSprite);
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
        new SimpleHealthStrategy()
    );

    controls = new Controls(
        (e) => onkeydown(e, player),
        (e) => onkeyup(e, player)
    );

    const boardProps: BasicBoardProps = {
        width: DEFAULTS.width,
        height: DEFAULTS.height,
        backgroundColor: 0x456268,
        player,
        onMovementEvent: ballMovementEvents
    }
    board = new BasicBoard(boardProps);

    score = 0;
    level = 0;
    combo = 1;

    const canvasElement = document.getElementById("canvas");
    canvasElement?.appendChild(board.app.view);
}

function destroyGameObjects() {
    console.log("Destroying game!");

    gameOver();
}

function gameLoop(delta: number): void {
    if (isPlaying) {
        frames++;
        board.update();
    }
}

function updatePlayers(gameRoomState: IGameRoomState) {
    for (let teamType of TeamType) {
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
}

function startGame(gameRoomState: IGameRoomState) {

    console.log("START GAME");

    reset();

    isPlaying = true;
    setupControls();

    startFps();

    updatePlayers(gameRoomState);

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

// const changePlayer = (playData: IPlayData) => {
    
//     currentPlayerNumber = (currentPlayerNumber === 1) ? 2 : 1;

//     if (currentPlayerNumber === 1) {
//         changePlayer1();
//     }
//     else {
//         changePlayer2();
//     }
// }

// const changePlayer1 = () => {
//     const playerLabel = document.getElementById("game_ready-current_player");
//     if (playerLabel)
//         playerLabel.innerText = "Turn: Player 1";    
    
//     const gameButton = document.getElementById("game_ready-button");
//     if (gameButton) {
//         gameButton.classList.remove("player2");
//         gameButton.classList.add("player1");
//     }
// }

// const changePlayer2 = () => {
//     const playerLabel = document.getElementById("game_ready-current_player");
//     if (playerLabel)
//         playerLabel.innerText = "Turn: Player 2";    
    
//     const gameButton = document.getElementById("game_ready-button");
//     if (gameButton) {
//         gameButton.classList.remove("player1");
//         gameButton.classList.add("player2");
//     }
// }

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
            console.log("starting as player", thisPlayerNumber);
            transitionState(
                "game_ready",
                () => {},
                () => {
                    gameRoomController.onGameBallEnterBoard((ball) => {
                        console.log("Making a ball from onGameBallEnterBoard", ball);
                        makeIncomingBall(ball);
                    })
                    gameRoomController.onGameScoreChange((gameRoomState) => {
                        handleScoreChange(gameRoomState);
                    });
                    initGameObjects();
                    startGame(startGameData.state);
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



/* END GAME ROOM CONNECTIVITY */


/* UI EVENTS */

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

/* END UI EVENTS */


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
let ballsInPlay: IBallState[] = [];

/* END GLOBALS */

const testGame = false;

if (!testGame) connectToServer();

// Dummy in the game board
if (testGame) transitionState(
    "game_ready",
    async () => { 
        thisPlayerNumber = 1;

        gameRoomController = new MockGameRoomController();
        gameRoomController.connect();
        gameRoomController.onGameBallEnterBoard((ball) => {
            makeTestBall(ball);
        })
        gameRoomController.onGameScoreChange((gameRoomState) => {
            handleScoreChange(gameRoomState);
        });

        initGameObjects();
        startGame(mockGameRoomState);

        const testBalls = 5;
        const timeBetweenBalls = 500;
        for (let i = 0; i < testBalls; i++) {
            (gameRoomController as MockGameRoomController).makeTestBall();
            await new Promise(resolve => setTimeout(resolve, timeBetweenBalls));
        }
    }
);