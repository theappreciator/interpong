import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from '@socket.io/component-emitter';

class SocketService {
	public socket: Socket | null = null;
	public didConnectPreviously = false;

	private static _instance: SocketService;

	private constructor() {}

	public static get Instance() {
		return this._instance || (this._instance = new this());
	}

	public connect(
		url: string,
		isConnected: () => void,
		isDisconnected: (err?: Error) => void
	): Promise<Socket<DefaultEventsMap, DefaultEventsMap>> {

		return new Promise((rs, rj) => {
			this.socket = io(url);

			if (!this.socket) return rj();

			this.socket.on("connect_error", (err) => {
				console.log("Connection error: ", err);
				rj(err);

				isDisconnected();
			});

			this.socket.on("disconnect", (reason) => {
				console.log("Disconnected from socket server!", reason);

				isDisconnected();
			})

			this.socket.on("connect", () => {
				if (!this.didConnectPreviously) {
					this.didConnectPreviously = true;
					console.log("Connected to the socket server!");
					rs(this.socket as Socket);
				}
				else {
					console.log("Automatically re-connected to the socket server!");
				}

				isConnected();
			});
		});
	}

	public async doPing(
		socket: Socket
	) {
		console.log("About to send ping");
		socket.emit("ping");
	}

	public async onPong(
		socket: Socket,
		listener: () => void
	) {
		if (socket.hasListeners("pong")) {
			socket.off("pong");
		}
		
		socket.on("pong", listener);
	}
}

export default SocketService;
