import { Container, Service } from 'typedi';
import { SocketControllers } from "socket-controllers";
import { Server, Socket} from "socket.io";
import * as controllers from "./api/controllers/";
import chalk from "chalk";
import * as log4js from "log4js";
const logger = log4js.getLogger();



export default (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // io.on("connection", (socket: Socket) => {
  //   logger.debug("Connection happened on io.on('connection')", socket.id);
  // });
  new SocketControllers(
    {
      io: io,
      container: Container,
      controllers: Object.values(controllers)
    }
  );

  return io;
};
