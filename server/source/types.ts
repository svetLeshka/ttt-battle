export type eventCh =
  | string
  | "ReceiveMessage"
  | "SendMessage"
  | "Ping"
  | "GetPool";

export type dataTypeCh = string | number | boolean | any;

export type playerString = "krestik" | "nolik";
export type fieldString = "X" | "O";

export interface IMove {
  nickname: string;
  side: string;
  row: number;
  column: number;
}

export interface IPlayers {
  krestik: string | null;
  nolik: string | null;
}

export interface IServer extends IPlayers {
  ip: string;
}
