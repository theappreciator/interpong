# Interpong

Balls bouncing around a multi-verse

## Setup

### Environment
| Key | location | Description |
| - | - | - |
| `REACT_APP_SOCKET_SERVER_URL` | frontend | The url, with port, to the backend socket server, used by the front end. |
| `PORT` | server | The incoming port for the backend server. |

#### Local Development
`.env` file, server (./)
```
PORT=3000;
```

`.env` file, frontend (./frontend/)
```
REACT_APP_SOCKET_SERVER_URL="http://localhost:3000";
```