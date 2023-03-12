import React, { useEffect, useState } from "react";
import styled from "styled-components";
import "./App.css";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { SocketService } from "./services";
import { JoinRoom } from "./components/joinRoom";
import GameContext, { IGameContextProps } from "./gameContext";
import { Game } from "./components/game";
import { DebugInfo } from "./components/debuginfo";

const AppContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1em;
`;

const WelcomeText = styled.h1`
  margin: 0;
  color: #8e44ad;
`;

const MainContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function App() {
    const [isInRoom, setInRoom] = useState(false);
    const [isRoomReady, setIsRoomReady] = useState(false);
    const [playerSymbol, setPlayerSymbol] = useState<"x" | "o">("x");
    const [isPlayerTurn, setPlayerTurn] = useState(false);
    const [isGameStarted, setGameStarted] = useState(false);

    const [socket, setSocket] = useState<void | Socket<DefaultEventsMap, DefaultEventsMap>>();


    const connectSocket = async () => {
        const url = process.env.REACT_APP_SOCKET_SERVER_URL;
        if (!url) {
            console.log("No url provided!");
            return;
        }

        const isConnected = () => setIsConnected(true);
        const isDisconnected = () => setIsConnected(false);

        const newSocket = await SocketService.Instance
            .connect(url, isConnected, isDisconnected)
            .then((v) => {
                console.log("Completed connecting to " + url);
                return v;
            })
            .catch((err) => {
                console.log("Error connecting:", err);
            });

        setSocket(newSocket);
    };

    useEffect(() => {
        connectSocket();
    }, []);


    const [isConnected, setIsConnected] = useState(socket?.connected || false);
    const [lastPong, setLastPong] = useState<string>();

    // useEffect(() => {
    //   socket.on('connect', () => {
    //     setIsConnected(true);
    //   });

    //   socket.on('disconnect', () => {
    //     setIsConnected(false);
    //   });

    //   socket.on('pong', () => {
    //     console.log("pong");
    //     setLastPong(new Date().toISOString());
    //   });

    //   return () => {
    //     socket.off('connect');
    //     socket.off('disconnect');
    //     socket.off('pong');
    //   };
    // }, []);




    const gameContextValue: IGameContextProps = {
        isConnected,
        setIsConnected,
        isInRoom,
        setInRoom,
        isRoomReady,
        setIsRoomReady,
        playerSymbol,
        setPlayerSymbol,
        isPlayerTurn,
        setPlayerTurn,
        isGameStarted,
        setGameStarted,
    };

    console.log("About to re-render APP");

    return (
        <GameContext.Provider value={gameContextValue}>
            <AppContainer>
                <WelcomeText>Welcome to Tic-Tac-Toe</WelcomeText>
                <DebugInfo/>
                <MainContainer>
                    {!isInRoom && <JoinRoom />}
                    {isInRoom && <Game />}
                </MainContainer>
            </AppContainer>
        </GameContext.Provider>
    );
}

export default App;
