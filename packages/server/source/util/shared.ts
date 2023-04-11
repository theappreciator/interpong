import { Socket } from "socket.io";
import { getRooms } from "./sockUtils";

const getSocketPrettyName = (socket: Socket) => {
    return `[id] ${socket.id} [address] ${socket.handshake.address}`;
}

const getRoomsPrettyName = (rooms:Map<string, Set<string>>, requesterId?: string) => {
    const roomsExcludingRequester = getRooms(rooms);

    let roomsDetail: string[] = [];

    if (roomsExcludingRequester.size <= 0)
        roomsDetail.push("None");
    else
        roomsExcludingRequester.forEach((r, i) => {
            roomsDetail.push(`${i}: ${r.size}`);
        })

    return roomsDetail;
}

export {
    getSocketPrettyName,
    getRoomsPrettyName
}