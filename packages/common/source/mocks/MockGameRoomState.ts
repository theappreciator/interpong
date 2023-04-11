import { GameStateStatus, IGameRoomState } from "../types"
import { mockBall } from "./MockBallState"
import { mockPlayer1, mockPlayer2 } from "./MockPlayerState"



const mockGameRoomState: IGameRoomState = {
    players: [{...mockPlayer1}, {...mockPlayer2}],
    game: {
        status: GameStateStatus.GAME_STARTED
    },
    balls: [{...mockBall}]
}

export {
    mockGameRoomState
}