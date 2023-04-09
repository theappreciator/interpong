import { GAME_EVENTS, ROOM_CONSTANTS, ROOM_EVENTS } from "@interpong/common";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Namespace, Server, Socket } from "socket.io";



const getRoomIdFromName = (roomName: string) => {
    return ROOM_CONSTANTS.ROOM_IDENTIFIER + roomName;
}

const getSocketsInRoom = async (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomName: string) => {
    let roomId = roomName;
    if (!roomName.startsWith(ROOM_CONSTANTS.ROOM_IDENTIFIER)) {
        roomId = getRoomIdFromName(roomName);
    }
    
    const sockets = await io.in(roomId).fetchSockets();
    return sockets || [];
};

const getRoomForSocket = (socket: Socket): string => {
    const socketRooms = Array.from(socket.rooms.values()).filter(
        (r) => r !== socket.id
    );

    // Assumption - a socket can only be in 1) it's private room, and 2) a single game room
    const gameRoom = socketRooms && socketRooms[0];

    return gameRoom;
}


export {
    getRoomIdFromName,
    getSocketsInRoom,
    getRoomForSocket
}