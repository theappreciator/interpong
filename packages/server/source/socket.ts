import { useSocketServer } from "socket-controllers";
import { Server, Socket} from "socket.io";



export default (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("DEBUG - Connection happened on io.on('connection')", socket.id);
  });

  useSocketServer(io, { controllers: [__dirname + "/api/controllers/*.ts"] });

  return io;
};
