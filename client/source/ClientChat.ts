import { dataTypeCh, eventCh } from "./types";
import UDP from "dgram";
import Emitter from "events";
import { EventInfo } from "./EventInfo";
import { connectEnum, eventEnum } from "./constants";

export class ClientChat {
  private timer: NodeJS.Timer | null = null;
  public readonly Client: UDP.Socket;
  public Address: string;
  public Port: number;
  public Messages: [string, string][] = [];
  private emitter = new Emitter.EventEmitter();
  private role: string = connectEnum.OTHER;

  private checkForNewMessages() {
    //const GetPool = new EventInfo("GetPool", this.Nickname, "check");
    //this.sendServerData(GetPool.toString());
  }

  public on(eventName: string, handler: (msgs: [string, string][]) => void) {
    this.emitter.on(eventName, handler);
  }

  public constructor(Port: number = 1333, Address: string = "127.0.0.1") {
    this.Port = Port;
    this.Address = Address;
    this.Client = UDP.createSocket("udp4");

    this.Client.on("message", (msg, info) => {
      const data = EventInfo.fromJson(Buffer.from(msg).toString());
      console.log(data, data.data.port, this.Port);
      if (data.port != this.Port) return;

      if (data.eventType == eventEnum.RECIVE_MOVE) {
        console.log(data.data);
        /*this.Messages.push(...data.data);
        this.emitter.emit("newMessage", data.data);*/
      } else if (data.eventType == eventEnum.GET_MOVES) {
        if (data.data != this.Messages.length) {
          const GetNewMessages = new EventInfo(
            "ReceiveMessage",
            data.data - this.Messages.length
          );
          this.sendServerData(GetNewMessages.toString());
        }
      } else if (
        data.eventType == eventEnum.CONNECT &&
        (data.data.role == connectEnum.KRESTIK ||
          data.data.role == connectEnum.NOLIK ||
          data.data.role == connectEnum.OTHER)
      ) {
        console.log("Connection: " + data.data.role);
        this.role = data.data.role;
        this.Address = data.data.address;
        this.Port = data.data.port;
      }
    });

    this.Client.on("close", () => {
      const closing = new EventInfo(eventEnum.CLOSED, this.role);
      this.sendServerData(closing.toString());
    });

    const connectToServer = new EventInfo(eventEnum.CONNECT, null);
    this.Client.connect(this.Port, this.Address, () => {
      this.sendServerData(connectToServer.toString());
    });

    /*const GetAllMessages = new EventInfo(eventEnum.GET_MOVES, "All");
    this.sendServerData(GetAllMessages.toString());*/
  }

  public sendMessage(msg: string): void {
    const SendMessage = new EventInfo("SendMessage", msg);
    this.sendServerData(SendMessage.toString());
  }

  private sendServerData(data: string) {
    const buffer = Buffer.from(data);
    this.Client.send(buffer);
  }

  public startReceiving(interval: number = 100) {
    this.timer = setInterval(() => this.checkForNewMessages(), interval);
  }

  public close() {
    const closing = new EventInfo(eventEnum.CLOSED, this.role);
    this.sendServerData(closing.toString());
    this.Client.close();
  }

  public getRole() {
    return this.role;
  }

  public drawFigure(row: number, column: number) {
    const move = new EventInfo(eventEnum.SEND_MOVE, {
      port: this.Port,
      side: this.role,
      row: row,
      column: column,
    });
    this.sendServerData(move.toString());
  }
}
