import { BallType, PlayerType } from '../sprites';
import { BasicBoard } from '../View/BasicBoard';
import { Socket } from "socket.io-client";
import { IGameRoomState, IRoomState, IScoreData, IStartGame, IBallState, IBallUpdateState, TeamType, IPlayerState } from '@interpong/common';
import { IGameRoomController } from '.';
import { SoloMovementEvents, SpriteActions } from '../sprites/events';
import { GAME_SCORE_EVENTS } from '@interpong/common';
import { GameStateType, IGameState, WaitingToConnectGameState } from '../GameStates';
import { getInputValue } from '../utils';
import { IBallSpriteFactory } from '../factories/BallSpriteFactory';
import { IPlayerSpriteFactory } from '../factories/PlayerSpriteFactory';
import { IBoardFactory } from '../factories/BoardFactory';
import { DirectionalControls } from '../InputControls/';
import { KeyboardControls } from '../InputControls/';
import { PointerControlsFactory } from '../factories/PointerControlsFactory';



interface IGamePageController {

    // Starting point from page
    initiate(): void;


    // State initiated logic
    doConnected(): void;
    doReConnected(): void;
    doDisconnected(wasConnected: boolean, e: any): void;

    joinRoom(roomName: string): Promise<string>;
    startGame(startGameData: IStartGame): void;

    transitionUI(toSection: GameStateType): void
    destroyGameObjects(): void;
    doRoomListUpdate(roomStates: IRoomState[]): void;


    // UI logic
    // startFps(): void;
    // endFps(): void;
    
    // Network logic
    // initServerConnection(): Promise<void>;





    
    // Game logic
    // startPlayingGame(gameRoomState: IGameRoomState): void;
    gameOver(): void;
    resetGameLogic(): void;
    ballMovementEventDestroyOnExit(movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[];
    ballMovementEventScoreOtherPlayer(movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[];
    ballMovementEvents(movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[];
    doScoreChange(gameRoomState: IGameRoomState): void;
    makeIncomingBall(ball: IBallState): void;
    initGameObjects(): void;
    gameLoop(delta: number): void;
    updatePlayers(gameRoomState: IGameRoomState): void;

    // Player logic
    setupControls(playerType: PlayerType): void;
    removeControls(): void;

    // state entry points
    setGameState(newState: IGameState): void;

}
class GamePageController implements IGamePageController {

    private _score: number;
    private _isPlaying: boolean;
    private _controls?: DirectionalControls;
    private _board?: BasicBoard;
    private _player?: IPlayerState;
    private _state: IGameState;

    private _frames: number;
    private _fpsInterval?: NodeJS.Timer;

    private _gameRoomController: IGameRoomController<Socket>;
    private _ballSpriteFactory: IBallSpriteFactory;
    private _playerSpriteFactory: IPlayerSpriteFactory;
    private _boardFactory: IBoardFactory;

    
    constructor(
        // TODO: use dependency injection
        gameRoomController: IGameRoomController<Socket>,
        ballSpriteFactory: IBallSpriteFactory,
        playerSpriteFactory: IPlayerSpriteFactory,
        boardFactory: IBoardFactory
    ) {
        // TODO: consider a "just created, not doing anything at all" state, and then transition to WaitingToConnect as part of the initiate call
        this._state = new WaitingToConnectGameState(this);

        this._gameRoomController = gameRoomController;
        this._ballSpriteFactory = ballSpriteFactory;
        this._playerSpriteFactory = playerSpriteFactory;
        this._boardFactory = boardFactory;

        this._score = 0;
        this._isPlaying = false;
        this._board = undefined;
        this._frames = 0;
        this._fpsInterval = undefined;        
    }

    private set _roomName(roomName: string) {
        this.updateWaitingInRoomName(roomName);
    }

    public setGameState = (newState: IGameState): void => {
        console.log("Old state: ", this._state);
        console.log("New state: ", newState);
        this._state = newState;
    }

    public initiate = (): void => {
        // consider this being driven by the state, not directly called from index.ts
        this.initServerConnection();
        this.initUI();
    }

    public transitionUI = (toSection: GameStateType): void => {
        const elementsToHide = document.getElementsByClassName('visible-section');
        Array.from(elementsToHide).forEach(e => {
            e.classList.remove('visible-section');
        })
        
        const sectionId = 'state-' + toSection;
        const elementToShow = document.getElementById(sectionId);
        if (!elementToShow) {
            throw new Error(`Could not find section ${sectionId}`)
        }
        elementToShow.classList.add('visible-section');
    }

    public startGame = (startGameData: IStartGame): void => {
        console.log("Firing onStartGame()");
        console.log(startGameData);
        this._player = {...startGameData.player};
        console.log(`Starting as player: ${this._player.playerNumber} team: ${this._player.team}`)
        
        this.initGameObjects();
        this.startPlayingGame(startGameData.state);
    }

    public doRoomListUpdate = (roomStates: IRoomState[]): void => {
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
                            // TODO: Should room.roomId actually be a room name here?
                            this._state.handleJoiningRoom(room.roomId);
                        })
                        span.insertAdjacentElement("afterend", button);
                    }
    
                    roomsElement.prepend(div);
                }
            }
        }
    }

    public doConnected = () => {
        console.log("Firing PageController isConnected()");

        this._gameRoomController.doGetRooms();

        // setTimeout(() => {
        //     joinRoom("auto_join_room");
        // }, 500);
    };

    public doReConnected = (): void => {
        console.log("Just reconnected to server");

        // TODO: need some logic here
    };
    
    public doDisconnected = (wasConnected: boolean, e: any): void => {
        console.log(`Firing index isDisconnected, wasConnected:${wasConnected}`, e);

        // TODOL need some logic here
    }

    public joinRoom = (roomName: string | undefined): Promise<string> => {
        if (!roomName) {
            throw new Error(`Room name to join not provided`);
        }

        // TODO: Finish admin implementation
        // this._gameRoomController.onAdmin(() => {
        //     console.log("Starting the admin screen!");
        // })

        return this._gameRoomController.joinGameRoom(roomName)
        .then((joinedRoomName) => {
            // if (joined === "ADMIN_START") {
            //     // TODO: finish Admin implementation
            //     this.transitionState(
            //         "game_room_admin",
            //         () => {},
            //         () => {}
            //     );
            // }
            // else {

                this._roomName = joinedRoomName;

                // TODO: is this a name or an id, and does it matter?
                return joinedRoomName;
            // }
        })
        .catch((err) => {
            alert(err + ", Room Name: " + roomName);
            throw new Error(`Not able to join game room ${roomName}`);
        });
    };



    /**************************/
    /* All the methods below  */
    /**************************/

    private initServerConnection = (): Promise<void> => {
        // network
        this._gameRoomController.onConnected(this._state.handleConnectedToServer);
        this._gameRoomController.onReConnected(this._state.handleReconnectedToServer);
        this._gameRoomController.onDisconnected(this._state.handleDisconnectedFromServer);

        // room
        this._gameRoomController.onRoomsUpdate(this._state.handleRoomListUpdate);
        this._gameRoomController.onRoomReadyToStartGame(this._state.handleRoomReadyToStartGame);

        // game
        this._gameRoomController.onGameBallEnterBoard(this._state.handleGameBallEnteredBoard);
        this._gameRoomController.onGameScoreChange(this._state.handleGameScoreChange);
        this._gameRoomController.onStartGame(this._state.handleStartGame);


        
        this._gameRoomController.connect();

        return Promise.resolve();
    };

    private initUI = (): void => {
        const joinRoomButton: HTMLElement | null = document.getElementById("game_room_selector-join_room");
        if (joinRoomButton) {
            joinRoomButton.addEventListener("click", (e) => {
                e.preventDefault();

                const roomName = getInputValue("game_room_selector-room_name");
                this._state.handleJoiningRoom(roomName);
            });
        }   
    }

    private updateWaitingInRoomName = (roomName: string): void => {
        const waitingRoomLabel = document.getElementById("state-game_room_waiting-room_label");
        if (waitingRoomLabel) {
            waitingRoomLabel.innerText = `Room name: ${roomName}`;
        }

        const gameRoomLabel = document.getElementById("room");
        if (gameRoomLabel) {
            gameRoomLabel.innerText = `Room name: ${roomName}`;
        }
    }

    private startPlayingGame = (gameRoomState: IGameRoomState) => {

        console.log("START GAME");

        if (!this._board) {
            throw new Error(`Board object not initiated!`);
        }
    
        this.resetGame();
    
        this._isPlaying = true;
    
        this.startFps();
    
        this.updatePlayers(gameRoomState);
    
        this._board.app.ticker.add((delta) => {
            this.gameLoop(delta);
        });
        this._board.app.ticker.start();
    }

    public gameLoop = (delta: number): void => {
        if (this._isPlaying) {
            this._frames++;
            this._board?.update();
        }
    }
    
    private startFps = (): void => {
        this._fpsInterval = setInterval(() => {   
            const fps = this._frames;
            this._frames = 0;
        
            const framesElement = document.querySelector('#fps span');
            if (framesElement) 
                framesElement.innerHTML = fps.toString();
        
        }, 1000);
    }
    
    private endFps = (): void => {
        clearInterval(this._fpsInterval);
    }
    
    public setupControls = (playerType: PlayerType): void => {
        if (!this._board) {
            throw new Error("Board not setup for adding controls");
        }
        const controls = new DirectionalControls(playerType);
        const keyboardControls = new KeyboardControls();
        const pointerControls = new PointerControlsFactory().makePointerControls(this._board);
        controls.addKeyboardInput(keyboardControls);
        controls.addPointerInput(pointerControls);
        this._controls = controls;
    }
    
    public removeControls = (): void => {
        // this._controls?.remove();

        // // TODO: this needs to live as part of the controls, not here
        // this._board?.onPlayerPointerClickDown(() => {});
        // this._board?.onPlayerPointerClickUp(() => {});
        // this._board?.onPlayerPointerClickDown(() => {});
    }
    
    public gameOver = (): void => {
    
        this._isPlaying = false;
        this._board?.app.ticker.stop();
        this._board?.app.ticker.remove(this.gameLoop);

        this.endFps();
    
        this.removeControls();
    }

    public resetGame = (): void => {
        this.resetGameObjects();
        this.resetGameUI();
        this.resetGameLogic();
    }

    public resetGameObjects = (): void => {
        this._board?.reset();
    }
    
    public resetGameUI = (): void => {

    }

    public resetGameLogic = (): void => {
        this._score = 0;
    }

    public ballMovementEventDestroyOnExit = (movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[] => {
        if ((this._player?.team === "left" && movementEvent.includes(SoloMovementEvents.TRANSFERRED_RIGHT_WALL)) ||
            (this._player?.team === "right" && movementEvent.includes(SoloMovementEvents.TRANSFERRED_LEFT_WALL))) {
    
            console.log("Transferred", ball.center, ball.v);
    
            const ballState: IBallUpdateState = {
                id: ball.ballId,
                lastPosition: ball.center,
                lastDirection: ball.v
            }
            this._gameRoomController.doGameBallLeaveBoard(ballState);
    
            const actions: SpriteActions[] = [];
            actions.push(SpriteActions.DESTROY);
            return [...actions];
        }
    
        return [];
    }
    
    public ballMovementEventScoreOtherPlayer = (movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[] => {
        if ((this._player?.team === "left" && movementEvent.includes(SoloMovementEvents.HIT_LEFT_WALL)) ||
            (this._player?.team === "right" && movementEvent.includes(SoloMovementEvents.HIT_RIGHT_WALL))) {
    
            const scoreData: IScoreData = {
                player: this._player?.playerNumber,
                // TODO: is currentScore relevant since it is calculated server side anyway?
                currentScore: this._score,
                event: GAME_SCORE_EVENTS.WALL_HIT
            }
    
            this._gameRoomController.doGameScoreChange(scoreData);
        }
    
        return [];
    }
    
    
    
    public ballMovementEvents = (movementEvent: SoloMovementEvents[], ball: BallType): SpriteActions[] => {
        let actions: SpriteActions[] = [];
    
    
        if (movementEvent.includes(SoloMovementEvents.TRANSFERRED_RIGHT_WALL) || movementEvent.includes(SoloMovementEvents.TRANSFERRED_LEFT_WALL)) {
            const newActions = this.ballMovementEventDestroyOnExit(movementEvent, ball)
            actions = [...newActions];
        }
        else if (movementEvent.includes(SoloMovementEvents.HIT_LEFT_WALL) || movementEvent.includes(SoloMovementEvents.HIT_RIGHT_WALL)) {
            actions = [...(this.ballMovementEventScoreOtherPlayer(movementEvent, ball))];
        }
    
        return actions;
    }
    
    public doScoreChange = (gameRoomState: IGameRoomState): void => {
        const thisPlayerState = gameRoomState.players.find(p => p.id === this._player?.id);
    
        if (!thisPlayerState) {
            throw new Error(`Player state for player ${this._player?.playerNumber} unexpectedly undefined`);
        }
    
        this.updatePlayers(gameRoomState);
    }
    
    public makeIncomingBall = (ball: IBallState): void => {
        // TODO: this check is redundant, if our player is invalid here there is a much bigger problem
        if (this._player) {        
            console.log("About to enter a new ball", ball.lastPosition, ball.lastDirection);

            const ballSprite = this._ballSpriteFactory.makeBallSprite(ball, this._player);

            this._board?.addNewBall(ballSprite);
        }
    }
    
    public initGameObjects = (): void => {
        if (!this._player) {
            throw new Error(`Player not set`);
        }

        const playerSprite = this._playerSpriteFactory.makePlayerSprite(this._player?.team);
        this._board = this._boardFactory.makeBoard(playerSprite, this.ballMovementEvents);
        this.setupControls(playerSprite);
    
        const canvasElement = document.getElementById("canvas");
        if (!canvasElement) {
            throw new Error(`Coud not find #canvas element`);
        }
        canvasElement.appendChild(this._board.app.view);
    }
    
    public destroyGameObjects = (): void => {
        console.log("Destroying game!");

        this.gameOver();
    }
    
    public updatePlayers = (gameRoomState: IGameRoomState): void => {
        for (let teamType of TeamType) {
            const teamElement = document.getElementById(`game_ready-teams_${teamType}_players`);
            if (teamElement) {
                const players = gameRoomState.players.filter(p => p.team === teamType).sort((a, b) => a.score - b.score);
                for (let i = 0; i < players.length; i++) {
                    const player = players[i];
                    // TODO: consider moving these dynamic ids to functions somewhere
                    const playerElementId = `players-${teamType}-socket-${player.id}`
                    let div = document.getElementById(playerElementId);
                    if (!div) {
                        div = document.createElement("div");
                        div.id = playerElementId;
                        div.classList.add("team-player");
                        div.innerText = `Player ${player.playerNumber} ${this._player?.id === player.id ? '(you)' : ''}`;
                    }
    
                    let span = div.firstElementChild as HTMLElement;
                    if (!span) {
                        span = document.createElement("span");
                        div.append(span);
                    }
                    span.innerText = `${player.score.toLocaleString()}`;
    
                    teamElement.prepend(div);
    
                    if (player.playerNumber === this._player?.playerNumber) {
                        // TODO: reconcile when local score data is different from server score data
                    }
                }
                const playerIds = gameRoomState.players.map(p => p.id);
                for (let c of teamElement.children) {
                    if (!playerIds.some(pid => `players-${teamType}-socket-${pid}` === c.id)) {
                        teamElement.removeChild(c);
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
}

export default GamePageController;