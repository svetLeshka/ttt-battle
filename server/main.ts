import UDP from "dgram";
import { EventInfo } from "./source/EventInfo";
import { IMove, IPlayers, playerString } from "./source/types";
import {
  moves,
  players,
  eventEnum,
  connectEnum,
  sendEnum,
} from "./source/constants";

const Server = UDP.createSocket("udp4");
const Port = 1333;
const serverName = "~server~";

//const Messages: [string, string][] = [];

Server.on("listening", async () => {
  const Address = Server.address();
  console.log(`Server listening on ${Address.address}:${Address.port}`);
});

const HandleRecieve = async (message: Buffer, info: UDP.RemoteInfo) => {
  const data = EventInfo.fromJson(Buffer.from(message).toString());
  let response = new EventInfo();
  console.dir(data);
  if (data.eventType == eventEnum.GET_MOVES) {
    //response = new EventInfo(data.eventType, moves);
  } else if (data.eventType == eventEnum.SEND_MOVE) {
    const msg: IMove = data.data;
    moves.push(msg);
    response = new EventInfo(eventEnum.RECIVE_MOVE, msg);
    HandleSend(sendEnum.SEND_TO_ALL, response, info);
  } else if (data.eventType == eventEnum.CONNECT && !players.krestik) {
    console.dir("krestik");
    players.krestik = data.data;
    response = new EventInfo(
      data.eventType,
      {
        role: connectEnum.KRESTIK,
      },
      serverName
    );
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (data.eventType == eventEnum.CONNECT && !players.nolik) {
    console.dir("nolik");
    players.nolik = data.data;
    response = new EventInfo(
      data.eventType,
      {
        role: connectEnum.NOLIK,
      },
      serverName
    );
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (data.eventType == eventEnum.CONNECT) {
    console.dir("other");
    (players.other as string[]).push(data.data);
    response = new EventInfo(
      data.eventType,
      {
        role: connectEnum.OTHER,
      },
      serverName
    );
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (
    data.eventType == eventEnum.CLOSED &&
    (data.data == connectEnum.KRESTIK || data.data == connectEnum.NOLIK)
  ) {
    console.dir("close " + data.data);
    players[data.data as playerString] = null;
  } else if (
    data.eventType == eventEnum.CLOSED &&
    data?.data?.role == connectEnum.OTHER
  ) {
    console.dir("close other " + data?.data?.nickname);
    players.other.splice(players.other.indexOf(data?.data?.nickname), 1);
    players.other = [...players.other];
  }

  //HandleSend(sendEnum.SEND_TO_ALL, response, info);
  //Server.send(response.toString(), info.port, info.address);
};

const HandleSend = async (
  reducer: sendEnum,
  response: EventInfo,
  info: UDP.RemoteInfo
) => {
  if (reducer == sendEnum.SEND_TO_ALL) {
    if (players.krestik && response.nickname != players.krestik) {
      Server.send(response.toString());
    }
    if (players.nolik && response.nickname != players.nolik) {
      Server.send(response.toString());
    }
    players.other.forEach((user) => {
      Server.send(response.toString());
    });
  } else if (reducer == sendEnum.SEND_TO_ONE) {
    console.dir(info.port, info.address);
    Server.send(response.toString(), info.port, info.address);
  }
};

Server.on("message", HandleRecieve);
Server.bind(Port);
