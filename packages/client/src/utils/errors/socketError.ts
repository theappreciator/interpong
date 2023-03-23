import { BaseError } from "./baseError";

type SocketErrorName = 
    | 'SOCKET_NOT_CONNECTED'

export class SocketError extends BaseError<SocketErrorName> {}