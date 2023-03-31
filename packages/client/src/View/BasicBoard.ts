import * as PIXI from 'pixi.js';
import Collision from '../Collision';
import { BallType, Circle, PlayerType } from '../sprites';
import { SoloMovementEvents, SpriteActions } from '../sprites/events';
import Shape from '../sprites/Shape';
import { Rectangle } from 'pixi.js';
import { RectanglePlayerShapeHit } from '../sprites/RectanglePlayer';
import { IPlayData, Vector } from '@interpong/common';

export interface BasicBoardProps {
    width: number,
    height: number,
    backgroundColor: number,
    player: PlayerType,
    // coin: Coin,
    // monsters: Monster[],
    ball?: BallType,
    // onPlayerCollideWithMonster: (continuePlaying: boolean) => void,
    // onPlayerCollideWithCoin: () => void,
    onMovementEvent: (movementEvent: SoloMovementEvents[], position: Vector, direction: Vector) => SpriteActions[],
}

enum Corners {
    TOP_LEFT = 1,
    TOP_RIGHT = 2,
    BOTTOM_RIGHT = 3,
    BOTTOM_LEFT = 4
}

export class BasicBoard {
    private _app: PIXI.Application;
    private _player: PlayerType;
    // private _coin: Coin;
    // private _monsters: Monster[];
    private _ball?: BallType;
    
    private _markers: Rectangle[];
    // private _playerCollideWithMonster: () => void = () => {};
    // private _playerCollideWithCoin: (coin: Coin) => void = () => {};

    private _movementEvent: (movementEvent: SoloMovementEvents[], position: Vector, direction: Vector) => SpriteActions[] = () => [];

    private _score: number;
    private _level: number;

    constructor({ 
        width,
        height,
        backgroundColor,
        player,
        // coin,
        // monsters,
        ball,
        // onPlayerCollideWithMonster,
        // onPlayerCollideWithCoin,
        onMovementEvent
    }: BasicBoardProps) {
        this._score = 0;
        this._level = 0;

        this._markers = [];

        this._player = player;
        // this._coin = coin;
        // this._monsters = monsters;
        this._ball = ball;

        // this._playerCollideWithMonster = () => {
        //     console.log("Triggering collision with monster");
        //     const isDead = this._player.takeDamage();
        //     console.log("isDead?", isDead);
        //     onPlayerCollideWithMonster(!isDead);
        // }
        // this._playerCollideWithCoin = (coin: Coin) => { 
        //     console.log("Triggering collision with coin");
        //     onPlayerCollideWithCoin();
        //     coin.random(this._app.view.width, this._app.view.height);
        //     this.addMonster();
        //     this._player.speedUp();
        // }

        this._movementEvent = (movementEvent, position, direction) => {
            const actions = [...onMovementEvent(movementEvent, position, direction)];
            return actions;
        }

        this._app = new PIXI.Application({width, height, antialias:true});
        this._app.ticker.stop();
        this._app.renderer.backgroundColor = backgroundColor;

        this._app.stage.addChild(this._player.getSpriteObj());
        // this._app.stage.addChild(this._coin.getSpriteObj());
        if (this._ball)
            this._app.stage.addChild(this._ball.getSpriteObj());
        // this._monsters.forEach(m => this._app.stage.addChild(m.getSpriteObj()));

        // const markerColor = 0x00ffff;
        // const marker100a = new PIXI.Graphics();
        // marker100a.x = 0;
        // marker100a.y = 0;
        // marker100a
        //     .beginFill(markerColor)
        //     .drawRect(0, 0, 100, 10)
        //     .endFill();
        // this._app.stage.addChild(marker100a);
        // const marker100b = new PIXI.Graphics();
        // marker100b.x = 0;
        // marker100b.y = 0;
        // marker100b
        //     .beginFill(markerColor)
        //     .drawRect(100, 10, 100, 10)
        //     .endFill();
        // this._app.stage.addChild(marker100b);
        // const marker100v = new PIXI.Graphics();
        // marker100v.x = 0;
        // marker100v.y = 0;
        // marker100v
        //     .beginFill(markerColor)
        //     .drawRect(0, 0, 10, 100)
        //     .endFill();
        // this._app.stage.addChild(marker100v);
        // const marker100vb = new PIXI.Graphics();
        // marker100vb.x = 0;
        // marker100vb.y = 0;
        // marker100vb
        //     .beginFill(markerColor)
        //     .drawRect(10, 100, 10, 100)
        //     .endFill();
        // this._app.stage.addChild(marker100vb);
    }

    get app(): PIXI.Application {
        return this._app;
    }

    get score(): number {
        return this._score;
    }

    get level(): number {
        return this._level;
    }

    get player(): PlayerType {
        return this._player;
    }

    update(): void {
        const viewWidth = this.app.view.width;
        const viewHeight = this.app.view.height;


        this._player.update(viewWidth, viewHeight);
        if (this._ball) {
            const newBallDirection = Collision.checkPlayerAndBall(this._player, this._ball);
            if (newBallDirection) {
                this._ball.updateShape(undefined, newBallDirection);
                this._player.updateShape(RectanglePlayerShapeHit);
            } 
            else {
                this._player.updateShape();
            }

            const ballMovementEvents = this._ball.update(viewWidth, viewHeight) || [];
            if (ballMovementEvents.length > 0) {
                const spriteActions = this._movementEvent(ballMovementEvents, this._ball.center, this._ball.v);
                if (spriteActions.includes(SpriteActions.DESTROY)) {
                    this._ball.remove(this.app);
                    this._ball = undefined;
                }
            }
            else {
                const newBallDirection = Collision.checkPlayerAndBall(this._player, this._ball);
                if (newBallDirection) {
                    this._ball.updateShape(undefined, newBallDirection);
                    this._player.updateShape(RectanglePlayerShapeHit);
                } 
                else {
                    this._player.updateShape();
                }
            }
        }

        // this._coin.update(this._app.view.width, this._app.view.height);
        // if (Collision.checkPlayerAndCoin(this._player, this._coin)) {
        //     this._playerCollideWithCoin(this._coin);
        // }

        // this._monsters.forEach(m => {
        //     let alreadyCollided = false;
        //     if (Collision.checkPlayerAndMonster(this._player, m)) {
        //         this._playerCollideWithMonster();
        //         alreadyCollided = true;
        //     }
        //     if (!alreadyCollided) {
        //        m.update(viewWidth, viewHeight);

        //         if (Collision.checkPlayerAndMonster(this._player, m)) {
        //             this._playerCollideWithMonster();
        //         }
        //     }
        //     else {
        //         m.remove(this.app);
        //     }
        //});

        
    }

    reset(): void {
        // this._monsters.forEach(m => m.reset(this.app));
        // this._monsters = [];
        this._player?.reset(this.app);
        this._ball?.reset(this.app);
        // this._coin?.reset(this.app);
    }

    getCornerPos(): Vector {
        const corner = Math.ceil(Math.random() * 4);
        let x, y;

        switch (corner) {
            case (Corners.TOP_LEFT):
                x = 0;
                y = 0;
                break;
            case (Corners.TOP_RIGHT):
                x = this._app.view.width;
                y = 0;
                break;
            case (Corners.BOTTOM_RIGHT):
                x = this._app.view.width;
                y = this._app.view.height;
                break;
            case (Corners.BOTTOM_LEFT):
                x = 0;
                y = this._app.view.height;
                break;
            default:
                x = 0; y = 0;
                break;
        }

        return {x, y};
    }

    addNewBall(ball: BallType) {
        this._ball = ball;
        this._app.stage.addChild(this._ball.getSpriteObj());
    }

    // addMonster() {
    //     const radius = Math.random() * 10 + 10;

    //     const randomCorner = this.getCornerPos();

    //     const x = Math.min(Math.max(randomCorner.x, radius), this._app.view.width - radius);
    //     const y = Math.min(Math.max(randomCorner.y, radius), this._app.view.height - radius);

    //     const v: Vector = {
    //         x: (2 + (Math.random() * 4)) * ((randomCorner.x <= radius) ? 1 : -1),
    //         y: (2 + (Math.random() * 4)) * ((randomCorner.y <= radius) ? 1 : -1)
    //     }

    //     const monster = new Monster(0x79a3b1, radius, v, {x, y});
    //     this._monsters.push(monster);
    //     this._app.stage.addChild(monster.getSpriteObj());
    // }
}