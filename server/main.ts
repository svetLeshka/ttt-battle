import UDP from "dgram";
import { EventInfo } from "./source/EventInfo";
import { eventEnum, connectEnum, sendEnum } from "./source/constants";
import { ServerChild } from "./source/ServerChild";

const Server = UDP.createSocket("udp4");
let Port = 1333;
const Address = "192.168.0.9";
const serverName = "~server~";
const servers = new Map<number, ServerChild>();

Server.on("listening", async () => {
  const Address = Server.address();
  console.log(`Server listening on ${Address.address}:${Address.port}`);
  Port++;
});

const HandleRecieve = async (message: Buffer, info: UDP.RemoteInfo) => {
  const data = EventInfo.fromJson(Buffer.from(message).toString());
  let response = new EventInfo();
  //console.dir(data);
  if (data.eventType == eventEnum.CONNECT) {
    let isServerFound = false;
    for (const [port, serverCh] of servers.entries()) {
      const servInfo = serverCh.getInfo();
      if (servInfo.nolik === null) {
        response = new EventInfo(eventEnum.SERVER_FOUND, {
          port: port,
          address: servInfo.ip,
        });
        Server.send(response.toString(), info.port, info.address);
        isServerFound = true;
        break;
      }
    }

    if (!isServerFound) {
      const newServer = new ServerChild(
        Port,
        Address,
        serverName + Port,
        1333,
        Address
      );
      servers.set(Port, newServer);
      newServer.initServer().then((res) => {
        const servInfo = (res as ServerChild).getInfo();
        response = new EventInfo(eventEnum.SERVER_FOUND, {
          port: servInfo.port,
          address: servInfo.ip,
        });
        Server.send(response.toString(), info.port, info.address);
      });
      Port++;
    }
  } else if (data.eventType == eventEnum.PLAYER_CONNECT_TO_SERVER) {
    response = new EventInfo(eventEnum.PLAYER_CONNECT_TO_SERVER, {
      nickname: data.data.nickname,
      info: info,
    });
    Server.send(response.toString(), data.data.port, data.data.ip);
  } else if (data.eventType == eventEnum.GAME_OVER) {
    for (const port of servers.keys()) {
      if (port == info.port) {
        servers.delete(port);
        console.dir(`Server child on port ${port} was deleted`);
        break;
      }
    }
  }
};

Server.on("message", HandleRecieve);
Server.bind(Port, Address);
