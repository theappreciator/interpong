import { SOCKET_EVENTS } from "@interpong/common";
import {
  ConnectedSocket,
  OnConnect,
  OnDisconnect,
  SocketController,
  SocketIO
} from "socket-controllers";
import { Socket, Server } from "socket.io";
import { prettyPrintRooms, prettyPrintSocket } from "../../util/sockUtils";

@SocketController()
export class MainController {

  @OnConnect()
  public async onConnection(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {

    prettyPrintSocket(socket, "New Socket Connected");
    prettyPrintRooms(io.sockets.adapter.rooms, socket.id);

    socket.on("custom_event", (data: any) => {
      console.log("Data: ", data);
    });

    socket.on(SOCKET_EVENTS.PING, (data: any) => {
      console.log("ping");
      console.log("Sending pong");
      socket.emit(SOCKET_EVENTS.PONG);
    })
  }

  @OnDisconnect()
  public onDisconnect(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {
    console.log("There was a disconnect: ", socket.id);
  }
}

