import { SOCKET_EVENTS } from "@interpong/common";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { io, Socket } from "socket.io-client";
import { INetworkService } from "..";



const TIMEOUT_CONNECTING = 1000;

class SocketService implements INetworkService<Socket> {
	private didConnectPreviously = false;

	private isReConnected: (socket: Socket) => void = () => {console.log("Default SocketService onReconnected")};
	private isDisconnected: (message: string) => void = () => {console.log("Default SocketService onDisconnected")};
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
				rj("Socket couldn't connect and was null")
			};

			socket.on("connect_error", (err) => {
				console.log("Connection error: ", err);

				clearTimeout(timeout);
				rj(err);

				this.isDisconnected(err.message);
			});

			socket.on("disconnect", (reason) => {
				console.log("Disconnected from socket server!", reason);
				this.isDisconnected(reason);
			})

			socket.on("connect", () => {
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

	public onReConnected(listener: (socket: Socket) => void) {
		console.log("Setting SocketService onReConnected()");
		this.isReConnected = listener;
	}

	public onDisconnected(listener: (message: string) => void) {
		console.log("Setting SocketService onDisconnected");
		this.isDisconnected = listener;
	}	

	public doPing(socket: Socket): void {
		console.log("About to send " + SOCKET_EVENTS.PING);
		socket.emit(SOCKET_EVENTS.PING);
	}

	public onPing(
		listener: () => void
	) {
		this.isPing = listener;
	}

	public onPong(
		listener: () => void
	) {
		this.isPong = listener;
	}
}

export default SocketService;
