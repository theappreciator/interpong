import * as PIXI from 'pixi.js';
import Collision from '../Collision';
import { BallType, PlayerType } from '../sprites';
import { SoloMovementEvents, SpriteActions } from '../sprites/events';
import { Rectangle } from 'pixi.js';

export interface BasicBoardProps {
    width: number,
    height: number,
    backgroundColor: number,
    player: PlayerType,
    onMovementEvent: (movementEvent: SoloMovementEvents[], ball: BallType) => SpriteActions[],
}

enum Corners {
    TOP_LEFT = 1,
    TOP_RIGHT = 2,
    BOTTOM_RIGHT = 3,
    BOTTOM_LEFT = 4
}

export class BasicBoard {
    private _app: PIXI.Application<HTMLCanvasElement>;
    private _player: PlayerType;
    private _balls: BallType[];
    
    private _markers: Rectangle[];

    private _movementEvent: (movementEvent: SoloMovementEvents[], ball: BallType) => SpriteActions[] = () => [];

    private _score: number;
    private _level: number;

    constructor({ 
        width,
        height,
        backgroundColor,
        player,
        onMovementEvent
    }: BasicBoardProps) {
        this._score = 0;
        this._level = 0;
        this._markers = [];
        this._balls = [];

        this._player = player;

        this._movementEvent = (movementEvent, ball) => {
            const actions = [...onMovementEvent(movementEvent, ball)];
            return actions;
        }

        this._app = new PIXI.Application<HTMLCanvasElement>({
            width,
            height,
            antialias: true,
            backgroundColor
        });
        this._app.ticker.stop();
        this._app.stage.addChild(this._player.getSpriteObj());

        this.routeBackgroundClicksToPlayer(width, height);
    }

    private routeBackgroundClicksToPlayer(width: number, height: number) {
        const stageBackground = new PIXI.Sprite(PIXI.Texture.WHITE);
        stageBackground.width = width;
        stageBackground.height = height;
        stageBackground.alpha = 0;
        stageBackground.interactive = true;
        stageBackground.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
            const position = {
                x: event.global.x,
                y: event.global.y
            }
            this._player.onPointerDown(position);
        });
        stageBackground.on("pointerup", (event: PIXI.FederatedPointerEvent) => {
            const position = {
                x: event.global.x,
                y: event.global.y
            }
            this._player.onPointerUp(position);
        });
        stageBackground.on("pointerupoutside", (event: PIXI.FederatedPointerEvent) => {
            const position = {
                x: event.global.x,
                y: event.global.y
            }
            this._player.onPointerUp(position);
        });
        stageBackground.on("globalpointermove", (event: PIXI.FederatedPointerEvent) => {
            const position = {
                x: event.global.x,
                y: event.global.y
            }
            this._player.onPointerMove(position);
        });
        this._app.stage.addChild(stageBackground);
    }

    get app(): PIXI.Application<HTMLCanvasElement> {
        return this._app
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

        const ballsToRemove = [];
        for (let i = 0; i < this._balls.length; i++) {
            const ball = this._balls[i];
            const newBallDirection = Collision.checkPlayerAndBall(this._player, ball);
            if (newBallDirection) console.log("playermove - newBallDirection", newBallDirection);
            if (newBallDirection) {
                ball.updateShape(undefined, newBallDirection);
                // this._player.updateShape(RectanglePlayerShapeHit);
            } 
            else {
                // this._player.updateShape();
            }

            const ballMovementEvents = ball.update(viewWidth, viewHeight) || [];
            if (ballMovementEvents.length > 0) {
                const spriteActions = this._movementEvent(ballMovementEvents, ball);
                if (spriteActions.includes(SpriteActions.DESTROY)) {
                    ball.remove(this.app);
                    ballsToRemove.push(i);
                }
            }
            else {
                const newBallDirection = Collision.checkPlayerAndBall(this._player, ball);
                if (newBallDirection) console.log("ballmove   - newBallDirection", newBallDirection);
                if (newBallDirection) {
                    ball.updateShape(undefined, newBallDirection);
                    // this._player.updateShape(RectanglePlayerShapeHit);
                } 
                else {
                    // this._player.updateShape();
                }
            }      
        }

        for (let i = (ballsToRemove.length - 1); i >= 0; i--) {
            const index = ballsToRemove[i];
            this._balls.splice(index, 1);
        }
    }

    reset(): void {
        this._player?.reset(this.app);
        this._balls.forEach(b => b.reset(this.app));
        this._balls = [];
    }

    addNewBall(ball: BallType) {
        this._balls.push(ball);
        this._app.stage.addChild(ball.getSpriteObj());
    }
}