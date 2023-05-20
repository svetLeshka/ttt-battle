import { IMove, IPlayers } from "./types";

export const moves: IMove[] = [];

export const players: IPlayers = {
  krestik: null,
  nolik: null,
  other: [],
};

export const readyPlayers: IPlayers = {
  krestik: null,
  nolik: null,
  other: [],
};

export const users = new Map();

export enum eventEnum {
  RECIVE_MOVE = "ReceiveMove",
  SEND_MOVE = "SendMove",
  PING = "Ping",
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
}

export enum sendEnum {
  SEND_TO_ALL = "all",
  SEND_TO_ONE = "one",
}

export enum connectEnum {
  KRESTIK = "krestik",
  NOLIK = "nolik",
  OTHER = "other",
}

export enum fieldEnum {
  krestik = "X",
  nolik = "O",
}
