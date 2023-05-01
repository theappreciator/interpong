import { GAME_EVENTS, ROOM_CONSTANTS, ROOM_EVENTS } from "@interpong/common";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Server, Socket } from "socket.io";



const getRoomIdFromName = (roomName: string): string => {
    let roomId = roomName;
    if (!isRoomId(roomName)) {
        roomId = ROOM_CONSTANTS.ROOM_IDENTIFIER.toLowerCase() + roomName;
    }

    return roomId;
}

const getRoomNameFromId = (roomId: string): string => {
    let roomName = roomId;
    if (isRoomId(roomId)) {
        roomName = roomName.substring(ROOM_CONSTANTS.ROOM_IDENTIFIER.toLowerCase().length);
    }

    return roomName;
}

const isRoomId = (roomId: string): boolean => {
    if (roomId.toLowerCase().startsWith(ROOM_CONSTANTS.ROOM_IDENTIFIER.toLowerCase())) {
        return true;
    }

    return false;
}

const getSocketsInRoom = async (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomName: string) => {
    let roomId = getRoomIdFromName(roomName);
    
    const sockets = await io.in(roomId).fetchSockets();
    return sockets || [];
};

const getSocketIdsInRoom = async (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, roomName: string) => {
    const sockets = await getSocketsInRoom(io, roomName);
    return sockets.map(s => s.id);
}

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
    getRoomNameFromId,
    isRoomId,
    getSocketsInRoom,
    getSocketIdsInRoom,
    getRoomForSocket
}