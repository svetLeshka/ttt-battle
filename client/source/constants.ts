import { IMove, IPlayers } from "./types";

export const moves: IMove[] = [];

export const players: IPlayers = {
  krestik: null,
  nolik: null,
  other: [],
};

export enum eventEnum {
  RECIVE_MOVE = "ReceiveMove",
  SEND_MOVE = "SendMove",
  GET_MOVES = "GetMoves",
  CONNECT = "ConnectToServer",
  CLOSED = "Closed",
  PLAYER_DISCONNECT = "playerDisconnected",
  PLAYER_CONNECT = "playerConnected",
  GET_PLAYERS = "getPlayers",
  GAME_OVER = "gameOver",
  READY_TO_START = "readyToStart",
  GAME_START = "gameStart",
  GET_READY = "getReady",
  SERVER_FOUND = "serverFound",
  PLAYER_CONNECT_TO_SERVER = "playerConnectedToServer",
  EVENTUALLY_CONNECTED = "eventuallyConnected",
}

export enum connectEnum {
  KRESTIK = "krestik",
  NOLIK = "nolik",
}
