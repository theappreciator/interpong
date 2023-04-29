import { IPlayerState } from "@interpong/common";
import { Server, Socket } from "socket.io";
import GameRoomStateService from "./gameRoomStateService";
import SocketRoomService from "./socketRoomService";



class SocketPlayerAdapter {
    public static playerFromSocket(socket: Socket): IPlayerState {
        const roomId = SocketRoomService.getGameRoomFromPlayerSocket(socket);
        const gameRoomStateService = new GameRoomStateService(roomId);
        const playerState = gameRoomStateService.players.find(p => p.id === socket.id);
        if (!playerState) {
            throw new Error(`Error getting player from socket ${socket.id}`);
        }
        return playerState;
    }

    public static playerFromPlayerNumber(roomId: string, playerNumber: number): IPlayerState {
        const gameRoomStateService = new GameRoomStateService(roomId);
        const player = gameRoomStateService.gameRoomState.players.find(p => p.playerNumber === playerNumber);
        if (!player) {
            throw new Error(`Could not get player for number ${playerNumber}`)
        }
        
        return player;
    }

    public static socketFromPlayer(io: Server, player: IPlayerState): Socket {
        const socket = io.sockets.sockets.get(player.id);
        if (!socket) {
            throw new Error(`Could not get socket for player ${player.id}`)
        }

        return socket;
    }
}

export default SocketPlayerAdapter;