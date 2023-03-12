import { SocketService } from "..";

abstract class BaseService {
    protected getSocket(errorMsg?: string) {
        const socket = SocketService.Instance.socket;

        if (!socket)
            throw new Error(errorMsg || "Not connected");

        return socket;
    }
}

export default BaseService;