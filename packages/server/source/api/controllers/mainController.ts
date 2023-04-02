import { SOCKET_EVENTS } from "@interpong/common";
import {
  ConnectedSocket,
  OnConnect,
  OnDisconnect,
  SocketController,
  SocketIO
} from "socket-controllers";
import {Service} from 'typedi';
import { Socket, Server } from "socket.io";
import { getRoomsPrettyName, getSocketPrettyName } from "../../util/shared";
import chalk from "chalk";
import * as log4js from "log4js";
import { GameController } from "./gameController";
import GameRoomStateService from "../../services/gameRoomStateService";
const logger = log4js.getLogger();

@SocketController()
@Service()
export class MainController {
  
  @OnConnect()
  public onConnection(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {
    logger.info(chalk.cyan("Socket Connected:   ", getSocketPrettyName(socket)));
    logger.info(chalk.blue("Available Rooms:    ", getRoomsPrettyName(io.sockets.adapter.rooms)));

    socket.on(SOCKET_EVENTS.PING, (data: any) => {
      console.log("ping");
      console.log("Sending pong");
      socket.emit(SOCKET_EVENTS.PONG);
    });
  }

  @OnDisconnect()
  public onDisconnect(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {
    logger.info(chalk.red("Socket Disconnected:", getSocketPrettyName(socket)));

    GameRoomStateService.deletePlayer(socket.id);

    logger.info(chalk.blue("Available Rooms:    ", getRoomsPrettyName(io.sockets.adapter.rooms)));

  }
}

