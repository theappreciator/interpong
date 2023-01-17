import React from "react";


export interface IGameContextProps {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  isInRoom: boolean;
  setInRoom: (inRoom: boolean) => void;
  isRoomReady: boolean;
  setIsRoomReady: (isReady: boolean) => void;
  playerSymbol: "x" | "o";
  setPlayerSymbol: (symbol: "x" | "o") => void;
  isPlayerTurn: boolean;
  setPlayerTurn: (turn: boolean) => void;
  isGameStarted: boolean;
  setGameStarted: (started: boolean) => void;
}

const defaultState: IGameContextProps = {
  isConnected: false,
  setIsConnected: () => {},
  isInRoom: false,
  setInRoom: () => {},
  isRoomReady: false,
  setIsRoomReady: () => {},
  playerSymbol: "x",
  setPlayerSymbol: () => {},
  isPlayerTurn: false,
  setPlayerTurn: () => {},
  isGameStarted: false,
  setGameStarted: () => {},
};

export default React.createContext(defaultState);
