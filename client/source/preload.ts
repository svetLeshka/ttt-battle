import { contextBridge }  from 'electron';
import { ClientChat } from './ClientChat';

let clientChat: ClientChat | null = null;

contextBridge.exposeInMainWorld('Api', {
    connect: (nickname: string, Port: number = 1333, Address: string = '127.0.0.1') => {
        clientChat = new ClientChat(nickname, Port, Address);
        clientChat.startReceiving();
    },
    sendMessage: (msg: string) => {
        if(clientChat) {
            clientChat.sendMessage(msg);
        }
    },
    getMsgs: (cnt: number) => {
        if(clientChat) {
            const msgsCount = clientChat.Messages.length; 
            if(msgsCount == cnt) return null;
            return clientChat.Messages.slice(cnt - msgsCount);
        }
    }
})