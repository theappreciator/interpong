import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import gameContext from "../../gameContext";
import { GameService } from "../../services";

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const RowContainer = styled.div`
  width: 100%;
  display: flex;
`;

interface ICellProps {
  borderTop?: boolean;
  borderRight?: boolean;
  borderLeft?: boolean;
  borderBottom?: boolean;
}

const Cell = styled.div<ICellProps>`
  width: 13em;
  height: 9em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  cursor: pointer;
  border-top: ${({ borderTop }) => borderTop && "3px solid #8e44ad"};
  border-left: ${({ borderLeft }) => borderLeft && "3px solid #8e44ad"};
  border-bottom: ${({ borderBottom }) => borderBottom && "3px solid #8e44ad"};
  border-right: ${({ borderRight }) => borderRight && "3px solid #8e44ad"};
  transition: all 270ms ease-in-out;

  &:hover {
    background-color: #8d44ad28;
  }
`;

const GameControlOverlay = styled.div`
  width: 100%;
  height: 100%;
  background-color: rgba(50, 50, 50, 0.5);
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 99;
  cursor: default;
`;

const X = styled.span`
  font-size: 100px;
  color: #8e44ad;
  &::after {
    content: "X";
  }
`;

const O = styled.span`
  font-size: 100px;
  color: #8e44ad;
  &::after {
    content: "O";
  }
`;

export type IPlayMatrix = Array<Array<string | null>>;
export interface IStartGame {
  start: boolean;
  symbol: "x" | "o";
}

export function Game() {
  console.log("About to re-render Game");
  const [matrix, setMatrix] = useState<IPlayMatrix>([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);

  const {
    playerSymbol,
    setPlayerSymbol,
    setPlayerTurn,
    isPlayerTurn,
    setGameStarted,
    isGameStarted,
  } = useContext(gameContext);

  const checkGameState = (matrix: IPlayMatrix) => {
    console.log("running checkGameState()");
    for (let i = 0; i < matrix.length; i++) {
      let row = [];
      for (let j = 0; j < matrix[i].length; j++) {
        row.push(matrix[i][j]);
      }

      if (row.every((value) => value && value === playerSymbol)) {
        return [true, false];
      } else if (row.every((value) => value && value !== playerSymbol)) {
        return [false, true];
      }
    }

    for (let i = 0; i < matrix.length; i++) {
      let column = [];
      for (let j = 0; j < matrix[i].length; j++) {
        column.push(matrix[j][i]);
      }

      if (column.every((value) => value && value === playerSymbol)) {
        return [true, false];
      } else if (column.every((value) => value && value !== playerSymbol)) {
        return [false, true];
      }
    }

    if (matrix[1][1]) {
      if (matrix[0][0] === matrix[1][1] && matrix[2][2] === matrix[1][1]) {
        if (matrix[1][1] === playerSymbol) return [true, false];
        else return [false, true];
      }

      if (matrix[2][0] === matrix[1][1] && matrix[0][2] === matrix[1][1]) {
        if (matrix[1][1] === playerSymbol) return [true, false];
        else return [false, true];
      }
    }

    //Check for a tie
    if (matrix.every((m) => m.every((v) => v !== null))) {
      return [true, true];
    }

    return [false, false];
  };

  const updateGameMatrix = (column: number, row: number, symbol: "x" | "o") => {
    console.log("running updateGameMatrix()");
    const newMatrix = [...matrix];

    if (newMatrix[row][column] === null || newMatrix[row][column] === "null") {
      newMatrix[row][column] = symbol;
      setMatrix(newMatrix);
    }

    const gameService = GameService.Instance;

    gameService.updateGame(newMatrix);
    const [currentPlayerWon, otherPlayerWon] = checkGameState(newMatrix);
    if (currentPlayerWon && otherPlayerWon) {
      gameService.gameWin("The Game is a TIE!");
      alert("The Game is a TIE!");
    } else if (currentPlayerWon && !otherPlayerWon) {
      gameService.gameWin("You Lost!");
      setTimeout(() => alert("You Won!"), 1);
    }

    setPlayerTurn(false);
  };

  const handleGameUpdate = () => {
    console.log("running handleGameUpdate()");
    const gameService = GameService.Instance;
    gameService.onGameUpdate((newMatrix) => {
      setMatrix(newMatrix);
      checkGameState(newMatrix);
      setPlayerTurn(true);
    });
  };

  const handleGameStart = () => {
    console.log("running handleGameStart()");
    const gameService = GameService.Instance;
    gameService.onStartGame((options) => {
      console.log("About to start game with options: ", options);
      setGameStarted(true);
      setPlayerSymbol(options.symbol);
      // if (options.start) setPlayerTurn(true);
      // else setPlayerTurn(false);

      setPlayerTurn(options.start);
    });
  };

  const handleGameWin = () => {
    console.log("running handleGameWin()");
    const gameService = GameService.Instance;
    gameService.onGameWin((message) => {
      setPlayerTurn(false);
      setTimeout(() => alert(message), 1);
    });
  };

  useEffect(() => {
    handleGameUpdate();
    handleGameStart();
    handleGameWin();
  }, []);

  return (
    <GameContainer>
      {!isGameStarted && (
        <h2>Waiting for Other Player to Join to Start the Game!</h2>
      )}
      <p>isGameStarted: {isGameStarted.toString()}</p>
      <p>isPlayerTurn: {isPlayerTurn.toString()}</p>
      <p>playerSymbol: {playerSymbol.toString()}</p>
      {(!isGameStarted || !isPlayerTurn) && <GameControlOverlay />}
      {matrix.map((row, rowIdx) => {
        return (
          <RowContainer key={rowIdx}>
            {row.map((column, columnIdx) => (
              <Cell
                key={columnIdx}
                borderRight={columnIdx < 2}
                borderLeft={columnIdx > 0}
                borderBottom={rowIdx < 2}
                borderTop={rowIdx > 0}
                onClick={() =>
                  updateGameMatrix(columnIdx, rowIdx, playerSymbol)
                }
              >
                {column && column !== "null" ? (
                  column === "x" ? (
                    <X />
                  ) : (
                    <O />
                  )
                ) : null}
              </Cell>
            ))}
          </RowContainer>
        );
      })}
    </GameContainer>
  );
}
