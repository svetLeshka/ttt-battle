import { contextBridge } from "electron";
import { ClientChat } from "./ClientChat";
import { connectEnum } from "./constants";

export let clientChat: ClientChat | null = null;

contextBridge.exposeInMainWorld("Api", {
  connect: (
    nick: string,
    Port: number = 1333,
    Address: string = "127.0.0.1"
  ) => {
    clientChat = new ClientChat(nick, Port, Address);
  },
  getMsgs: (cnt: number) => {
    if (clientChat) {
      const msgsCount = clientChat.Messages.length;
      if (msgsCount == cnt) return null;
      return clientChat.Messages.slice(cnt - msgsCount);
    }
  },
  closeConnection: () => {
    clientChat?.close();
  },
  getRole: () => {
    return clientChat?.getRole();
  },
  getSide: () => {
    return clientChat?.getSide();
  },
  getReady: () => {
    return clientChat?.getReady();
  },
  drawFigure: (row: number, column: number) => {
    clientChat?.drawFigure(row, column);
  },
  confirmed: (isGameContinue: boolean) => {
    clientChat?.continueGame(isGameContinue);
  },
});
