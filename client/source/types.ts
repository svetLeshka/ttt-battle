export type eventCh =
  | string
  | "ReceiveMessage"
  | "SendMessage"
  | "Ping"
  | "GetPool";

export type dataTypeCh = string | number | boolean | any;

export interface IMove {
  side: string;
  row: number;
  column: number;
}

export interface IPlayers {
  krestik: number | null;
  nolik: number | null;
  other?: number[];
}

export type playersType = "krestik" | "nolik";
