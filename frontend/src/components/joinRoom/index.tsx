import React, { useContext, useState } from "react";
import styled from "styled-components";
import gameContext from "../../gameContext";
import { GameService } from "../../services";

interface IJoinRoomProps {}

const JoinRoomContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 2em;
`;

const RoomIdInput = styled.input`
  height: 30px;
  width: 20em;
  font-size: 17px;
  outline: none;
  border: 1px solid #8e44ad;
  border-radius: 3px;
  padding: 0 10px;
`;

const JoinButton = styled.button`
  outline: none;
  background-color: #8e44ad;
  color: #fff;
  font-size: 17px;
  border: 2px solid transparent;
  border-radius: 5px;
  padding: 4px 18px;
  transition: all 230ms ease-in-out;
  margin-top: 1em;
  cursor: pointer;

  &:hover {
    background-color: transparent;
    border: 2px solid #8e44ad;
    color: #8e44ad;
  }
`;

export function JoinRoom(props: IJoinRoomProps) {
  const [roomName, setRoomName] = useState("TEST");
  const [isJoining, setJoining] = useState(false);

  const { setInRoom, isConnected } = useContext(gameContext);

  const handleRoomNameChange = (e: React.ChangeEvent<any>) => {
    const value = e.target.value;
    setRoomName(value);
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName || roomName.trim() === "") return;

    setJoining(true);

    const gameService = GameService.Instance;
    const joined = await gameService
      .joinGameRoom(roomName)
      .catch((err) => {
        alert(err + ", Room Name: " + roomName);
      });

    if (joined) {
      setJoining(false);

      setInRoom(true);
    }

  };

  return (
    <form onSubmit={joinRoom}>
      <JoinRoomContainer>
        <h4>Enter Room ID to Join the Game</h4>
        <RoomIdInput
          placeholder="Room ID"
          value={roomName}
          onChange={handleRoomNameChange}
        />
        <JoinButton type="submit" disabled={isJoining}>
          {!isConnected ? "Connecting..." :
            isJoining ? "Joining..." : "Join Room"}
        </JoinButton>
      </JoinRoomContainer>
    </form>
  );
}
