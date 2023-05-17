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

//const Messages: [string, string][] = [];

Server.on("listening", async () => {
  const Address = Server.address();
  console.log(`Server listening on ${Address.address}:${Address.port}`);
});

const HandleRecieve = async (message: Buffer, info: UDP.RemoteInfo) => {
  const data = EventInfo.fromJson(Buffer.from(message).toString());
  let response = new EventInfo("", "", info.port);

  if (data.eventType == eventEnum.GET_MOVES) {
    //response = new EventInfo(data.eventType, moves);
  } else if (data.eventType == eventEnum.SEND_MOVE) {
    const msg: IMove = data.data;
    moves.push(msg);
    response = new EventInfo(eventEnum.RECIVE_MOVE, msg);
    HandleSend(sendEnum.SEND_TO_ALL, response, info);
  } else if (data.eventType == eventEnum.CONNECT && !players.krestik) {
    console.dir("krestik");
    players.krestik = info.port;
    response = new EventInfo(data.eventType, {
      role: connectEnum.KRESTIK,
      address: info.address,
      port: info.port,
    });
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (data.eventType == eventEnum.CONNECT && !players.nolik) {
    console.dir("nolik");
    players.nolik = info.port;
    response = new EventInfo(data.eventType, {
      role: connectEnum.NOLIK,
      address: info.address,
      port: info.port,
    });
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (data.eventType == eventEnum.CONNECT) {
    console.dir("other");
    (players.other as number[]).push(info.port);
    response = new EventInfo(data.eventType, {
      role: connectEnum.OTHER,
      address: info.address,
      port: info.port,
    });
    HandleSend(sendEnum.SEND_TO_ONE, response, info);
  } else if (
    data.eventType == eventEnum.CLOSED &&
    (data.data == connectEnum.KRESTIK || data.data == connectEnum.NOLIK)
  ) {
    console.dir("close " + data.data);
    players[data.data as playerString] = null;
  } else if (
    data.eventType == eventEnum.CLOSED &&
    data.data == connectEnum.OTHER
  ) {
    console.dir("close other " + info.port);
    players.other.splice(players.other.indexOf(info.port), 1);
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
    if (players.krestik && info.port != players.krestik) {
      Server.send(response.toString(), players.krestik, info.address);
    }
    if (players.nolik && info.port != players.nolik) {
      Server.send(response.toString(), players.nolik, info.address);
    }
    players.other.forEach((user) => {
      Server.send(response.toString(), user, info.address);
    });
  } else if (reducer == sendEnum.SEND_TO_ONE) {
    console.dir(info.port, info.address);
    Server.send(response.toString(), info.port, info.address);
  }
};

Server.on("message", HandleRecieve);
Server.bind(Port);
