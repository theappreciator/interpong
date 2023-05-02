#!/usr/bin/env node

/**
 * Module dependencies.
 */
import "reflect-metadata";
// import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
// dotenv.config();
import app from "./app";
var debug = require("debug")("socketio-server:server");
import * as http from "http";
import socketServer from "./socket";
import * as log4js from "log4js";
import { PersistService } from "./services";
log4js.configure({
  appenders: {
    normal: {
      type: "stdout",
      layout: {
        type: "pattern",
        pattern: "%[[%d{yyyy/MM/dd-hh.mm.ss} %x{level1char}]%] %m",
        tokens: {
          level1char: function (logEvent) {
            return logEvent.level.levelStr.substring(0, 1);
          },
          level3char: function (logEvent) {
            return logEvent.level.levelStr.substring(0, 3);
          },
        },
      },
    }
  },
  categories: { default: { appenders: ["normal"], level: "debug" } },
});
const logger = log4js.getLogger();

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);  

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

const io = socketServer(server);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  debug("Listening on " + bind);

  console.log("Server Running on Port: ", port);
}
