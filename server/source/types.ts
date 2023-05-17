export type eventCh =
  | string
  | "ReceiveMessage"
  | "SendMessage"
  | "Ping"
  | "GetPool";

export type dataTypeCh = string | number | boolean | any;

export type playerString = "krestik" | "nolik";

export interface IMove {
  port: number;
  side: string;
  row: number;
  column: number;
}

export interface IPlayers {
  krestik: string | null;
  nolik: string | null;
  other: string[];
}
