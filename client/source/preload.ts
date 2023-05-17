import { contextBridge } from "electron";
import { ClientChat } from "./ClientChat";
import { connectEnum } from "./constants";

export let clientChat: ClientChat | null = null;

contextBridge.exposeInMainWorld("Api", {
  connect: (Port: number = 1333, Address: string = "127.0.0.1") => {
    clientChat = new ClientChat(Port, Address);
    //clientChat.startReceiving();
  },
  sendMessage: (msg: string) => {
    if (clientChat) {
      clientChat.sendMessage(msg);
    }
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
  drawFigure: (row: number, column: number) => {
    clientChat?.drawFigure(row, column);
  },
});
