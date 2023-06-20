import UDP from "dgram";
import Emitter from "events";
import { EventInfo } from "./EventInfo";
import { connectEnum, eventEnum, moves } from "./constants";

export class ClientChat {
  public readonly Client: UDP.Socket;
  public readonly nickname: string;
  public Address: string;
  public Port: number;
  public Messages: [string, string][] = [];
  private emitter = new Emitter.EventEmitter();
  private role: string = connectEnum.KRESTIK;
  private side: string = connectEnum.KRESTIK;
  private ready = false;

  public on(eventName: string, handler: (msgs: [string, string][]) => void) {
    this.emitter.on(eventName, handler);
  }

  public constructor(
    nick: string,
    Port: number = 1333,
    Address: string = "127.0.0.1"
  ) {
    this.nickname = nick;
    this.Port = Port;
    this.Address = Address;
    this.Client = UDP.createSocket("udp4");

    this.Client.on("message", (msg, info) => {
      let data = EventInfo.fromJson(Buffer.from(msg).toString());
      console.log(data, info);
      if (data.nickname == this.nickname) return;

      if (data.eventType == eventEnum.RECIVE_MOVE) {
        console.log(eventEnum.RECIVE_MOVE, data);
        this.setMove(data);
      } else if (data.eventType == eventEnum.GET_MOVES) {
        for (const move of data.data) {
          data.data = move;
          this.setMove(data);
        }
      } else if (data.eventType == eventEnum.CONNECT) {
        console.log("Connection: " + data.data.role);
        this.role = data.data.role;
        this.postConnect();
      } else if (data.eventType == eventEnum.GET_READY) {
        this.ready = data.data.ready ? data.data.ready : false;
      } else if (data.eventType == eventEnum.GAME_OVER) {
        const go = new CustomEvent("gameOver");
        document.dispatchEvent(go);
      } else if (data.eventType == eventEnum.GAME_START) {
        this.side = connectEnum.KRESTIK;
        const start = new CustomEvent("startGame");
        document.dispatchEvent(start);
        this.postConnect();
      } else if (data.eventType == eventEnum.SERVER_FOUND) {
        this.Client.disconnect();
        this.connectToServer(data.data.address, data.data.port);
        const start = new CustomEvent("startGame");
        document.dispatchEvent(start);
      }
    });

    this.connect();
  }

  private connect() {
    const connectToServer = new EventInfo(eventEnum.CONNECT, this.nickname);
    this.Client.connect(this.Port, this.Address, () => {
      this.sendServerData(connectToServer.toString());
    });
  }

  private connectToServer(address: string, port: number) {
    const oldAddress = this.Address;
    const oldPort = this.Port;
    this.Address = address;
    this.Port = port;
    const connectToServer = new EventInfo(eventEnum.PLAYER_CONNECT_TO_SERVER, {
      nickname: this.nickname,
      port: this.Port,
      ip: this.Address,
    });
    this.Client.connect(this.Port, this.Address, () => {
      const buffer = Buffer.from(connectToServer.toString());
      this.Client.send(buffer, oldPort, oldAddress);
    });
  }

  private postConnect() {
    const GetAllMoves = new EventInfo(eventEnum.GET_MOVES, this.nickname);
    this.sendServerData(GetAllMoves.toString());
    const getReady = new EventInfo(eventEnum.GET_READY, this.nickname);
    this.sendServerData(getReady.toString());
  }

  private sendServerData(data: string) {
    const buffer = Buffer.from(data);
    this.Client.send(buffer, this.Port, this.Address);
  }

  public close() {
    const closing = new EventInfo(eventEnum.CLOSED, {
      role: this.role,
      nickname: this.nickname,
    });
    this.sendServerData(closing.toString());
    this.Client.close();
  }

  public getRole() {
    return this.role;
  }

  public getSide() {
    return this.side;
  }

  public getReady() {
    return this.ready;
  }

  public continueGame(isGameContinue: boolean) {
    if (isGameContinue) {
      this.close();
      const re = new CustomEvent("re", {
        detail: { nickname: this.nickname },
      });
      document.dispatchEvent(re);
    } else {
      this.close();
    }
  }

  public drawFigure(row: number, column: number) {
    if (this.side != this.role) return;
    const move = new EventInfo(eventEnum.SEND_MOVE, {
      nickname: this.nickname,
      side: this.role,
      row: row,
      column: column,
    });
    this.side =
      this.side == connectEnum.KRESTIK
        ? connectEnum.NOLIK
        : connectEnum.KRESTIK;
    this.sendServerData(move.toString());
  }

  private setMove(data: EventInfo) {
    const move = {
      side: data.data.side,
      row: data.data.row,
      column: data.data.column,
    };
    document.dispatchEvent(
      new CustomEvent("recieveMove", {
        detail: move,
      })
    );
    moves.push(move);
    this.side =
      data.data.side == connectEnum.KRESTIK
        ? connectEnum.NOLIK
        : connectEnum.KRESTIK;
  }
}
