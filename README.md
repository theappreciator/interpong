# Interpong

Balls bouncing around a multi-verse

Adapted from: https://github.com/ipenywis/react-socketio-tic-tac-toe


## Setup

### Environment
| Key | location | Description |
| - | - | - |
| `REACT_APP_SOCKET_SERVER_URL` | client | The url, with port, to the backend socket server, used by the front end. |
| `PORT` | server | The incoming port for the backend server. |

#### Local Development
`.env` file, server (./)
```
PORT=3000;
```

`.env` file, client (./client/)
```
REACT_APP_SOCKET_SERVER_URL="http://localhost:3000";
```


Mermaid test
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

The end