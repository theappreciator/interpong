import {
  ConnectedSocket,
  OnConnect,
  OnDisconnect,
  SocketController,
  SocketIO,
} from "socket-controllers";
import { Socket, Server } from "socket.io";

@SocketController()
export class MainController {
  @OnConnect()
  public onConnection(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {
    console.log("New Socket connected: ", socket.id);

    console.log("Available rooms: ");
    console.log(io.sockets.adapter.rooms);

    socket.on("custom_event", (data: any) => {
      console.log("Data: ", data);
    });
  }

  @OnDisconnect()
  public onDisconnect(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {
    console.log("There was a disconnect: ", socket.id);
  }
}
