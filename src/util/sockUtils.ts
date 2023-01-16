import { Socket, Server } from "socket.io";

const SPACE_INDENT="  ";

const getRooms = (rooms:Map<string, Set<string>>, requesterId: string) => {
    const filteredRooms = new Map<string, Set<string>>();

    rooms.forEach((v, k) => {
        if (k !== requesterId) {
            filteredRooms.set(k, v);
        }
    });

    return filteredRooms;
}

const prettyPrintRooms = (rooms:Map<string, Set<string>>, requesterId: string = undefined, title: string = "Available rooms") => {
    const roomsExcludingRequester = getRooms(rooms, requesterId);

    const updatedTitle = requesterId ? title + " (excluding requester)" : title;
    console.log(updatedTitle + ":");
    if (roomsExcludingRequester.size <= 0)
        console.log("None");
    else
        roomsExcludingRequester.forEach((r, i) => {
            console.log(i + ": ", r);
        })
}

const prettyPrintSocket = (socket: Socket, title: string = "Socket") => {
    console.log(title + ": [id]", socket.id, "[address]", socket.handshake.address);
}

export {
    getRooms,
    prettyPrintRooms,
    prettyPrintSocket
}