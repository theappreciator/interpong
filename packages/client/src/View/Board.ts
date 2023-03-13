import * as PIXI from 'pixi.js';
import Collision from '../Collision';
import { Vector } from '../types';
import { Player, Coin, Monster} from '../sprites';

export interface BoardProps {
    width: number,
    height: number,
    backgroundColor: number,
    player: Player,
    coin: Coin,
    monsters: Monster[];
    onPlayerCollideWithMonster: (continuePlaying: boolean) => void,
    onPlayerCollideWithCoin: () => void,
}

enum Corners {
    TOP_LEFT = 1,
    TOP_RIGHT = 2,
    BOTTOM_RIGHT = 3,
    BOTTOM_LEFT = 4
}

export class Board {
    private _app: PIXI.Application;
    private _player: Player;
    private _coin: Coin;
    private _monsters: Monster[];

    private _playerCollideWithMonster: () => void;
    private _playerCollideWithCoin: (coin: Coin) => void;

    private _score: number;
    private _level: number;

    constructor({ 
        width,
        height,
        backgroundColor,
        player,
        coin,
        monsters,
        onPlayerCollideWithMonster,
        onPlayerCollideWithCoin
    }: BoardProps) {
        this._score = 0;
        this._level = 0;

        this._player = player;
        this._coin = coin;
        this._monsters = monsters;

        this._playerCollideWithMonster = () => {
            console.log("Triggering collision with monster");
            const isDead = this._player.takeDamage();
            console.log("isDead?", isDead);
            onPlayerCollideWithMonster(!isDead);
        }
        this._playerCollideWithCoin = (coin: Coin) => { 
            console.log("Triggering collision with coin");
            onPlayerCollideWithCoin();
            coin.random(this._app.view.width, this._app.view.height);
            this.addMonster();
            this._player.speedUp();
        }

        this._app = new PIXI.Application({width, height, antialias:true});
        this._app.ticker.stop();
        this._app.renderer.backgroundColor = backgroundColor;

        this._app.stage.addChild(this._player.getSpriteObj());
        this._app.stage.addChild(this._coin.getSpriteObj());
        this._monsters.forEach(m => this._app.stage.addChild(m.getSpriteObj()));
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

    get player(): Player {
        return this._player;
    }

    update(): void {
        const viewWidth = this.app.view.width;
        const viewHeight = this.app.view.height;

        this._player.update(this._app.view.width, this._app.view.height);
        if (Collision.checkPlayerAndCoin(this._player, this._coin)){
            this._playerCollideWithCoin(this._coin);
        }

        this._coin.update(this._app.view.width, this._app.view.height);
        if (Collision.checkPlayerAndCoin(this._player, this._coin)) {
            this._playerCollideWithCoin(this._coin);
        }

        this._monsters.forEach(m => {
            let alreadyCollided = false;
            if (Collision.checkPlayerAndMonster(this._player, m)) {
                this._playerCollideWithMonster();
                alreadyCollided = true;
            }
            if (!alreadyCollided) {
                m.update(viewWidth, viewHeight);

                if (Collision.checkPlayerAndMonster(this._player, m)) {
                    this._playerCollideWithMonster();
                }
            }
            else {
                m.remove(this.app);
            }
        });
    }

    reset(): void {
        this._monsters.forEach(m => m.reset(this.app));
        this._monsters = [];
        this._player?.reset(this.app);
        this._coin?.reset(this.app);
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

    addMonster() {
        const radius = Math.random() * 10 + 10;

        const randomCorner = this.getCornerPos();

        const x = Math.min(Math.max(randomCorner.x, radius), this._app.view.width - radius);
        const y = Math.min(Math.max(randomCorner.y, radius), this._app.view.height - radius);

        const v: Vector = {
            x: (2 + (Math.random() * 2)) * ((randomCorner.x <= radius) ? 1 : -1),
            y: (2 + (Math.random() * 2)) * ((randomCorner.y <= radius) ? 1 : -1)
        }

        const monster = new Monster(0x79a3b1, radius, v, {x, y});
        this._monsters.push(monster);
        this._app.stage.addChild(monster.getSpriteObj());
    }
}