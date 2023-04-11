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

const randomNumberBetween = (n1: number, n2: number) => {
    const random = Math.random();
    const diff = Math.abs(n2 - n1);
    return n1 + (random * diff);
}

const randomNumberWithVariance = (n1: number, variance: number) => {
    return randomNumberBetween(n1 - variance, n1 + variance);
}

export {
    getSocketPrettyName,
    getRoomsPrettyName,
    randomNumberBetween,
    randomNumberWithVariance
}