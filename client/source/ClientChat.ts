import {dataTypeCh, eventCh} from './types';
import UDP from 'dgram';
import Emitter from 'events'
import {EventInfo} from './EventInfo';

export class ClientChat {
    private timer: NodeJS.Timer | null = null;
    public readonly Client: UDP.Socket;
    public readonly Address: string;
    public readonly Port: number;
    public readonly Nickname: string;
    public Messages: [string, string][] = []; 
    private emitter = new Emitter.EventEmitter();

    private checkForNewMessages() {
        const GetPool = new EventInfo("GetPool", this.Nickname, "check");
        this.sendServerData(GetPool.toString());
    }

    public on(eventName: string, handler: (msgs: [string, string][]) => void) {
        this.emitter.on(eventName, handler);
    }

    public constructor(Nickname: string, Port: number = 1333, Address: string = '127.0.0.1') {
        this.Port = Port;
        this.Address = Address;
        this.Client = UDP.createSocket('udp4');
        this.Nickname = Nickname;
        
        this.Client.on("message", (msg, info) => {
            const data = EventInfo.fromJson(Buffer.from(msg).toString());
            
            if(data.eventType == "ReceiveMessage") {
                this.Messages.push(...data.data);
                this.emitter.emit('newMessage', data.data);
            } else if(data.eventType == "GetPool") {
                if(data.data != this.Messages.length) {
                    const GetNewMessages = new EventInfo("ReceiveMessage", this.Nickname, data.data - this.Messages.length);
                    this.sendServerData(GetNewMessages.toString());
                }
            }
        });
        
        const GetAllMessages = new EventInfo("ReceiveMessage", this.Nickname, "All");
        this.sendServerData(GetAllMessages.toString());        
    }

    public sendMessage(msg: string): void {
        const SendMessage = new EventInfo("SendMessage", this.Nickname, msg);
        this.sendServerData(SendMessage.toString());
    }

    private sendServerData(data: string) {
        const buffer = Buffer.from(data);
        this.Client.send(buffer, this.Port, this.Address);
    }

    public startReceiving(interval: number = 100) {
        this.timer = setInterval(() => this.checkForNewMessages(), interval);
    }
}