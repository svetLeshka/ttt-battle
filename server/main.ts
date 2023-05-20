import UDP from "dgram";
import { EventInfo } from "./source/EventInfo";
import { IMove, IPlayers, fieldString, playerString } from "./source/types";
import {
  moves,
  players,
  eventEnum,
  connectEnum,
  sendEnum,
  users,
  fieldEnum,
  readyPlayers,
} from "./source/constants";

const Server = UDP.createSocket("udp4");
const Port = 1333;
const serverName = "~server~";
let field = [
  ["", "", ""],
  ["", "", ""],
  ["", "", ""],
];
let readyState = false;

Server.on("listening", async () => {
  const Address = Server.address();
  console.log(`Server listening on ${Address.address}:${Address.port}`);
});

const HandleRecieve = async (message: Buffer, info: UDP.RemoteInfo) => {
  const data = EventInfo.fromJson(Buffer.from(message).toString());
  let response = new EventInfo();
  console.dir(data);
  if (data.eventType == eventEnum.GET_MOVES) {
    response = new EventInfo(data.eventType, moves);
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (data.eventType == eventEnum.SEND_MOVE) {
    const msg: IMove = data.data;
    console.dir("move by " + msg.side);
    moves.push(msg);
    response = new EventInfo(eventEnum.RECIVE_MOVE, msg, msg.nickname);
    HandleSend(sendEnum.SEND_TO_ALL, response, info);
    field[msg.row - 1][msg.column - 1] = fieldEnum[msg.side as playerString];
    if (checkWin(msg.row - 1, msg.column - 1)) {
      readyState = false;
      const response = new EventInfo(eventEnum.GAME_OVER, { winner: msg.side });
      HandleSend(sendEnum.SEND_TO_ALL, response, info);
    }
  } else if (data.eventType == eventEnum.CONNECT && !readyPlayers.krestik) {
    console.dir("connect krestik " + data.data);
    readyPlayers.krestik = data.data;
    users.set(data.data, info.port);
    if (readyPlayers[connectEnum.KRESTIK] && readyPlayers[connectEnum.NOLIK]) {
      startGame();
      response = new EventInfo(eventEnum.GAME_START);
      HandleSend(sendEnum.SEND_TO_ALL, response, info);
    }
    response = new EventInfo(data.eventType, {
      role: connectEnum.KRESTIK,
    });
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
    response = new EventInfo(eventEnum.PLAYER_CONNECT, {
      role: connectEnum.KRESTIK,
    });
    HandleSend(sendEnum.SEND_TO_ALL, response, info);
  } else if (data.eventType == eventEnum.CONNECT && !readyPlayers.nolik) {
    console.dir("connect nolik " + data.data);
    readyPlayers.nolik = data.data;
    users.set(data.data, info.port);
    if (readyPlayers[connectEnum.KRESTIK] && readyPlayers[connectEnum.NOLIK]) {
      startGame();
      response = new EventInfo(eventEnum.GAME_START);
      HandleSend(sendEnum.SEND_TO_ALL, response, info);
    }
    response = new EventInfo(data.eventType, {
      role: connectEnum.NOLIK,
    });
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
    response = new EventInfo(eventEnum.PLAYER_CONNECT, {
      role: connectEnum.NOLIK,
    });
    HandleSend(sendEnum.SEND_TO_ALL, response, info);
  } else if (data.eventType == eventEnum.CONNECT) {
    console.dir("connect other " + data.data);
    (players.other as string[]).push(data.data);
    users.set(data.data, info.port);
    response = new EventInfo(data.eventType, {
      role: connectEnum.OTHER,
    });
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (
    data.eventType == eventEnum.CLOSED &&
    (data?.data?.role == connectEnum.KRESTIK ||
      data?.data?.role == connectEnum.NOLIK)
  ) {
    console.dir(
      "close " + data?.data?.role + ", delete " + data?.data?.nickname
    );
    if (
      moves.length > 0 &&
      players[connectEnum.KRESTIK] != null &&
      players[connectEnum.NOLIK] != null
    ) {
      readyState = false;
      const response = new EventInfo(eventEnum.GAME_OVER, {
        winner: data.data.side,
      });
      HandleSend(sendEnum.SEND_TO_ALL, response, info);
    }
    users.delete(data?.data?.nickname);
    players[data?.data?.role as playerString] = null;
    if (
      players[connectEnum.KRESTIK] == null &&
      players[connectEnum.NOLIK] == null
    ) {
      clearField();
    }
  } else if (
    data.eventType == eventEnum.CLOSED &&
    data?.data?.role == connectEnum.OTHER
  ) {
    console.dir("close other " + data?.data?.nickname);
    users.delete(data?.data?.nickname);
    players.other.splice(players.other.indexOf(data?.data?.nickname), 1);
    players.other = [...players.other];
  } else if (data.eventType == eventEnum.GET_READY) {
    response = new EventInfo(data.eventType, { ready: readyState });
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (data.eventType == eventEnum.READY_TO_START) {
    players[data.data.role as playerString] = null;
  }
};

const HandleSend = async (
  reducer: sendEnum,
  response: EventInfo,
  info: UDP.RemoteInfo
) => {
  if (reducer == sendEnum.SEND_TO_ALL) {
    for (const userPort of users.values()) {
      Server.send(response.toString(), userPort);
    }
  } else if (reducer == sendEnum.SEND_TO_ONE) {
    console.dir(info.port, info.address);
    Server.send(response.toString(), info.port, info.address);
  }
};

Server.on("message", HandleRecieve);
Server.bind(Port);

const checkWin = (row: number, column: number) => {
  const winSymbol = field[row][column] as fieldString;
  if (
    field[row][0] == winSymbol &&
    field[row][1] == winSymbol &&
    field[row][2] == winSymbol
  )
    return true;
  if (
    field[0][column] == winSymbol &&
    field[1][column] == winSymbol &&
    field[2][column] == winSymbol
  )
    return true;
  if (
    ((row == 0 && column == 0) ||
      (row == 2 && column == 2) ||
      (row == 1 && column == 1)) &&
    checkDiagonal(winSymbol, false)
  )
    return true;
  if (
    ((row == 0 && column == 2) ||
      (row == 2 && column == 0) ||
      (row == 1 && column == 1)) &&
    checkDiagonal(winSymbol, true)
  )
    return true;
  return false;
};

const checkDiagonal = (winSymbol: fieldString, reverse: boolean) => {
  if (
    reverse &&
    field[0][2] == winSymbol &&
    field[1][1] == winSymbol &&
    field[2][0] == winSymbol
  ) {
    return true;
  } else if (
    field[0][0] == winSymbol &&
    field[1][1] == winSymbol &&
    field[2][2] == winSymbol
  ) {
    return true;
  }
  return false;
};

const startGame = () => {
  readyPlayers[connectEnum.KRESTIK] = null;
  readyPlayers[connectEnum.NOLIK] = null;
  readyState = true;
  clearField();
};

const clearField = () => {
  moves.length = 0;
  field = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
};
