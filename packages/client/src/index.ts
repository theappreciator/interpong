import * as PIXI from 'pixi.js';
import { DEFAULTS } from './constants';
import Controls from './Controls';
import SimpleMoveStrategy from './strategies/SimpleMoveStrategy';
import { Player, Coin, Monster } from './sprites';
import { Board, BoardProps } from './View/Board';
import SimpleSpeedStrategy from './strategies/SimpleSpeedStrategy';
import { SimpleHealthStrategy } from './strategies/SimpleHealthStrategy';



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

    document.querySelector("div#canvas")?.appendChild(board.app.view);

    const playButton: HTMLObjectElement | null = document.querySelector("#play");
    if (playButton)
        playButton.addEventListener("click", () => startGame());

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



let score: number;
let level: number;
let combo: number;
let isPlaying = false;
let controls: Controls;
let board: Board;
let frames: number = 0;
let fpsInterval: NodeJS.Timer;
const playButton: HTMLObjectElement | null = document.querySelector("#addMonster");
if (playButton)
    playButton.addEventListener("click", () => board.addMonster());
initGameObjects();
startGame();
