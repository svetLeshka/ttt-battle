import { IMove, IPlayers } from "./types";

export const moves: IMove[] = [];

export const players: IPlayers = {
  krestik: null,
  nolik: null,
  other: [],
};

export enum eventEnum {
  RECIVE_MOVE = "ReceiveMessage",
  SEND_MOVE = "SendMessage",
  PING = "Ping",
  GET_MOVES = "GetMoves",
  CONNECT = "ConnectToServer",
  CLOSED = "Closed",
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