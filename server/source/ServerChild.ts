import UDP from "dgram";
import { EventInfo } from "./EventInfo";
import { IMove, fieldString, playerString, IPlayers } from "./types";
import { eventEnum, connectEnum, sendEnum, fieldEnum } from "./constants";

export class ServerChild {
  private Server = UDP.createSocket("udp4");
  private readonly Port: number = 1333;
  private readonly serverName: string = "~server~";
  private users = new Map();
  private IP: string = "127.0.0.1";
  private parentPort: number = 1333;
  private parentIP: string = "127.0.0.1";
  private readyPlayers: IPlayers = {
    krestik: null,
    nolik: null,
  };
  private players: IPlayers = {
    krestik: null,
    nolik: null,
  };
  private moves: IMove[] = [];
  private field: string[][] = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
  private readyState = false;

  public constructor(port: number, serverName: string) {
    this.Port = port;
    this.serverName = serverName;
  }

  public getInfo() {
    return {
      krestik: this.readyPlayers.krestik || this.players.krestik,
      nolik: this.readyPlayers.nolik || this.players.nolik,
      ip: this.IP,
      port: this.Port,
    };
  }

  public initServer() {
    return new Promise((res, rej) => {
      this.Server.on("listening", async () => {
        const Address = this.Server.address();
        this.IP = Address.address;
        console.log(`Server listening on ${Address.address}:${Address.port}`);
        return res(this);
      });

      const HandleRecieve = async (message: Buffer, info: UDP.RemoteInfo) => {
        const data = EventInfo.fromJson(Buffer.from(message).toString());
        let response = new EventInfo();
        console.dir(data);
        if (data.eventType == eventEnum.GET_MOVES) {
          response = new EventInfo(data.eventType, this.moves);
          HandleSend(sendEnum.SEND_TO_ONE, response, info);
        } else if (data.eventType == eventEnum.SEND_MOVE) {
          const msg: IMove = data.data;
          console.dir("move by " + msg.side);
          this.moves.push(msg);
          response = new EventInfo(eventEnum.RECIVE_MOVE, msg, msg.nickname);
          HandleSend(sendEnum.SEND_TO_ALL, response, info);
          this.field[msg.row - 1][msg.column - 1] =
            fieldEnum[msg.side as playerString];
          if (this.checkWin(msg.row - 1, msg.column - 1)) {
            this.readyState = false;
            const response = new EventInfo(eventEnum.GAME_OVER, {
              winner: msg.side,
            });
            HandleSend(sendEnum.SEND_TO_ALL, response, info);
          }
        } else if (
          data.eventType == eventEnum.PLAYER_CONNECT_TO_SERVER &&
          !this.readyPlayers.krestik
        ) {
          console.dir("connect krestik " + data.data.nickname);
          this.readyPlayers.krestik = data.data.nickname;
          this.users.set(data.data.nickname, {
            port: data.data.info.port,
            ip: data.data.info.ip,
          });
          this.parentPort = data.data.info.port;
          this.parentIP = data.data.info.ip;
          if (
            this.readyPlayers[connectEnum.KRESTIK] &&
            this.readyPlayers[connectEnum.NOLIK]
          ) {
            this.startGame();
            response = new EventInfo(eventEnum.GAME_START);
            HandleSend(sendEnum.SEND_TO_ALL, response, info);
          }
          response = new EventInfo(eventEnum.CONNECT, {
            role: connectEnum.KRESTIK,
          });
          this.Server.send(
            response.toString(),
            data.data.info.port,
            data.data.info.ip
          );
          HandleSend(sendEnum.SEND_TO_ONE, response, {
            ...info,
            port: data.data.info.port,
          });
          response = new EventInfo(eventEnum.PLAYER_CONNECT, {
            role: connectEnum.KRESTIK,
          });
          HandleSend(sendEnum.SEND_TO_ALL, response, info);
        } else if (
          data.eventType == eventEnum.PLAYER_CONNECT_TO_SERVER &&
          !this.readyPlayers.nolik
        ) {
          console.dir("connect nolik " + data.data.nickname);
          this.readyPlayers.nolik = data.data.nickname;
          this.users.set(data.data.nickname, {
            port: data.data.info.port,
            ip: data.data.info.ip,
          });
          response = new EventInfo(eventEnum.CONNECT, {
            role: connectEnum.NOLIK,
          });
          this.Server.send(
            response.toString(),
            data.data.info.port,
            data.data.info.ip
          );
          HandleSend(sendEnum.SEND_TO_ONE, response, {
            ...info,
            port: data.data.info.port,
          });
          response = new EventInfo(eventEnum.PLAYER_CONNECT, {
            role: connectEnum.NOLIK,
          });
          HandleSend(sendEnum.SEND_TO_ALL, response, info);
          if (
            this.readyPlayers[connectEnum.KRESTIK] &&
            this.readyPlayers[connectEnum.NOLIK]
          ) {
            this.startGame();
            response = new EventInfo(eventEnum.GAME_START);
            HandleSend(sendEnum.SEND_TO_ALL, response, info);
          }
        } else if (data.eventType == eventEnum.CLOSED) {
          console.dir(
            `server ${this.serverName} closed ${data?.data?.role} and deleted ${data?.data?.nickname}`
          );
          if (
            this.moves.length > 0 &&
            this.players[connectEnum.KRESTIK] != null &&
            this.players[connectEnum.NOLIK] != null
          ) {
            this.readyState = false;
            const response = new EventInfo(eventEnum.GAME_OVER, {
              winner: data.data.side,
            });
            HandleSend(sendEnum.SEND_TO_ALL, response, info);
          }
          this.users.delete(data?.data?.nickname);
          this.players[data?.data?.role as playerString] = null;
          if (
            this.players[connectEnum.KRESTIK] == null &&
            this.players[connectEnum.NOLIK] == null
          ) {
            this.clearField();
            response = new EventInfo(eventEnum.GAME_OVER);
            this.Server.send(
              response.toString(),
              this.parentPort,
              this.parentIP
            );
          }
        } else if (data.eventType == eventEnum.GET_READY) {
          response = new EventInfo(data.eventType, { ready: this.readyState });
          HandleSend(sendEnum.SEND_TO_ONE, response, info);
        } else if (data.eventType == eventEnum.READY_TO_START) {
          this.players[data.data.role as playerString] = null;
        }
      };

      const HandleSend = async (
        reducer: sendEnum,
        response: EventInfo,
        info: UDP.RemoteInfo
      ) => {
        if (reducer == sendEnum.SEND_TO_ALL) {
          for (const user of this.users.values()) {
            this.Server.send(response.toString(), user.port, user.ip);
          }
        } else if (reducer == sendEnum.SEND_TO_ONE) {
          let userSend;
          for (const user of this.users.values()) {
            if (user.port == info.port) {
              userSend = user;
              break;
            }
          }
          this.Server.send(response.toString(), userSend.port, userSend.ip);
        }
      };

      this.Server.on("message", HandleRecieve);
      this.Server.bind(this.Port);
    });
  }

  public checkWin = (row: number, column: number) => {
    const winSymbol = this.field[row][column] as fieldString;
    if (
      this.field[row][0] == winSymbol &&
      this.field[row][1] == winSymbol &&
      this.field[row][2] == winSymbol
    )
      return true;
    if (
      this.field[0][column] == winSymbol &&
      this.field[1][column] == winSymbol &&
      this.field[2][column] == winSymbol
    )
      return true;
    if (
      ((row == 0 && column == 0) ||
        (row == 2 && column == 2) ||
        (row == 1 && column == 1)) &&
      this.checkDiagonal(winSymbol, false)
    )
      return true;
    if (
      ((row == 0 && column == 2) ||
        (row == 2 && column == 0) ||
        (row == 1 && column == 1)) &&
      this.checkDiagonal(winSymbol, true)
    )
      return true;
    return false;
  };

  public checkDiagonal = (winSymbol: fieldString, reverse: boolean) => {
    if (
      reverse &&
      this.field[0][2] == winSymbol &&
      this.field[1][1] == winSymbol &&
      this.field[2][0] == winSymbol
    ) {
      return true;
    } else if (
      this.field[0][0] == winSymbol &&
      this.field[1][1] == winSymbol &&
      this.field[2][2] == winSymbol
    ) {
      return true;
    }
    return false;
  };

  public startGame = () => {
    this.players[connectEnum.KRESTIK] = this.readyPlayers[connectEnum.KRESTIK];
    this.players[connectEnum.NOLIK] = this.readyPlayers[connectEnum.NOLIK];
    this.readyPlayers[connectEnum.KRESTIK] = null;
    this.readyPlayers[connectEnum.NOLIK] = null;
    this.readyState = true;
    this.clearField();
  };

  public clearField = () => {
    this.moves.length = 0;
    this.field = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
  };
}
