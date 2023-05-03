import { Socket } from "socket.io";



export interface ISocketRoomService {

}



class SocketRoomService implements ISocketRoomService {


    constructor() {

    }

    public static getGameRoomFromPlayerSocket(socket: Socket): string {
        const socketRooms = Array.from(socket.rooms.values()).filter(
            (r) => r !== socket.id
        );
    
        // Assumption - a socket can only be in 1) it's private room, and 2) a single game room
        const gameRoom = socketRooms && socketRooms[0];
    
        return gameRoom;
    }
}

export default SocketRoomService;