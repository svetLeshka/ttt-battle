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
  private role: string = connectEnum.OTHER;
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

      if (data.nickname == this.nickname) return;

      if (data.eventType == eventEnum.RECIVE_MOVE) {
        console.log(eventEnum.RECIVE_MOVE, data);
        this.setMove(data);
      } else if (data.eventType == eventEnum.GET_MOVES) {
        for (const move of data.data) {
          data.data = move;
          this.setMove(data);
        }
      } else if (
        data.eventType == eventEnum.CONNECT &&
        (data.data.role == connectEnum.KRESTIK ||
          data.data.role == connectEnum.NOLIK ||
          data.data.role == connectEnum.OTHER)
      ) {
        console.log("Connection: " + data.data.role);
        this.role = data.data.role;
      } else if (data.eventType == eventEnum.GET_READY) {
        this.ready = data.data.ready ? data.data.ready : false;
      } else if (
        data.eventType == eventEnum.GAME_OVER &&
        this.role != connectEnum.OTHER
      ) {
        setTimeout(() => {
          const resp = confirm("go next?");
          if (resp) {
            const readyToStart = new EventInfo(eventEnum.READY_TO_START, {
              role: this.role,
            });
            this.sendServerData(readyToStart.toString());
            this.close();
            const re = new CustomEvent("re", {
              detail: { nickname: this.nickname },
            });
            document.dispatchEvent(re);
          } else {
            this.close();
          }
        }, 1000);
      } else if (data.eventType == eventEnum.GAME_START) {
        this.side = connectEnum.KRESTIK;
        const start = new CustomEvent("startGame");
        document.dispatchEvent(start);
        this.postConnect();
      }
    });

    this.connect();
    const start = new CustomEvent("startGame");
    document.dispatchEvent(start);
  }

  private connect() {
    const connectToServer = new EventInfo(eventEnum.CONNECT, this.nickname);
    this.Client.connect(this.Port, this.Address, () => {
      this.sendServerData(connectToServer.toString());
      this.postConnect();
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
