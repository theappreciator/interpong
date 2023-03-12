import React, { useContext, useState } from "react";
import styled from "styled-components";
import gameContext from "../../gameContext";
import { GameService, SocketService } from "../../services";

interface IDebugInfoProps {}

export function DebugInfo(props: IDebugInfoProps) {
    const { isConnected } = useContext(gameContext);
    const [lastPong, setLastPong] = useState<string>();
  
    console.log("About to re-render DebugInfo");
    console.log("Process env:", process.env);
    console.log("Environemnt: ", process.env.NODE_ENV);

    const doPong = () => {
        setLastPong(new Date().toISOString())
    };

    const socketService = SocketService.Instance;

    if (socketService.socket) {
        socketService.onPong(socketService.socket, doPong);
    }

    const sendPing = () => {
        if (socketService.socket) {
            console.log("Sending ping");
            socketService.doPing(socketService.socket);
        }
    }

    return (
        <>
            <p>Socket server url: {process.env.REACT_APP_SOCKET_SERVER_URL}</p>
            <p>Socket ID: {socketService?.socket?.id}</p>
            <p>Connected: {'' + isConnected}</p>
            <p>Last pong: {lastPong || '-'}</p>
            <button onClick={sendPing}>Send ping</button> 
        </>
    );
  }