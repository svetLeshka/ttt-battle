import UDP from "dgram";
import { EventInfo } from "./source/EventInfo";

const Server = UDP.createSocket('udp4');
const Port = 1333;

const Messages: [string, string][] = [];

Server.on("listening", async () => {
    const Address = Server.address();
    console.log(`Server listening on ${Address.address}:${Address.port}`);
});

const Handler = async (message: Buffer, info: UDP.RemoteInfo) => {
    const data = EventInfo.fromJson(Buffer.from(message).toString());
    let response = new EventInfo();

    if(data.eventType == "GetPool") {
        response = new EventInfo(data.eventType, Messages.length);
    } else if(data.eventType == "ReceiveMessage") {
        response = new EventInfo(data.eventType, data.data == "All"? Messages: Messages.slice(-data.data));
    } else if(data.eventType == "SendMessage") {
        var msg: [string, string] = [data.nickname, data.data as string];
        Messages.push(msg);
    }
    
    Server.send(response.toString(), info.port, info.address);
};

Server.on("message", Handler);
Server.bind(Port);