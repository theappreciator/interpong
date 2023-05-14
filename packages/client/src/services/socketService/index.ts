import { SOCKET_EVENTS } from "@interpong/common";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { io, Socket } from "socket.io-client";
import { INetworkService } from "..";



const TIMEOUT_CONNECTING = 1000;

class SocketService implements INetworkService<Socket> {
	private didConnectPreviously = false;
	private isConnected = false;

	private isReConnected: (socket: Socket) => void = () => {console.log("Default SocketService onReconnected")};
	private isDisconnected: (wasConnected: boolean, message: string) => void = () => {console.log("Default SocketService onDisconnected")};
	private isPing: () => void = () => {};
	private isPong: () => void = () => {};

	private static _instance: SocketService;

	private constructor() {}

	public static get Instance() {
		return this._instance || (this._instance = new this());
	}

	public createConnector(
		url: string
	): Promise<Socket> {

		return new Promise<Socket>((rs, rj) => {
			const socket = io(url);

			if (!socket) {
				this.isConnected = false;
				rj("Socket couldn't connect and was null")
			};

			socket.on("connect_error", (err) => {
				console.log("Connection error: ", err);

				const wasConnected = this.isConnected;
				this.isConnected = false;

				clearTimeout(timeout);
				rj(err);

				this.isDisconnected(wasConnected, err.message);
			});

			socket.on("disconnect", (reason) => {
				const wasConnected = this.isConnected;
				this.isConnected = false;
				console.log("Disconnected from socket server!", reason);
				this.isDisconnected(wasConnected, reason);
			})

			socket.on("connect", () => {
				this.isConnected = true;

				if (!this.didConnectPreviously) {
					this.didConnectPreviously = true;
					clearTimeout(timeout);
					rs(socket);
				}
				else {
					this.isReConnected(socket);
				}
			});

			socket.on(SOCKET_EVENTS.PING, this.isPing);
			socket.on(SOCKET_EVENTS.PONG, this.isPong);

            const timeout = setTimeout(() => {
                rj("Event: Connecting to server timed out")
            }, TIMEOUT_CONNECTING);		
		});
	}

	public onReConnected = (listener: (socket: Socket) => void) => {
		console.log("Setting SocketService onReConnected()");
		this.isReConnected = listener;
	}

	public onDisconnected = (listener: (wasConnected: boolean, message: string) => void) => {
		console.log("Setting SocketService onDisconnected");
		this.isDisconnected = listener;
	}	

	public doPing = (socket: Socket): void => {
		console.log("About to send " + SOCKET_EVENTS.PING);
		socket.emit(SOCKET_EVENTS.PING);
	}

	public onPing = (
		listener: () => void
	) => {
		this.isPing = listener;
	}

	public onPong = (
		listener: () => void
	) => {
		this.isPong = listener;
	}
}

export default SocketService;
