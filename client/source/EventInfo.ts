
import {dataTypeCh, eventCh} from './types';

export class EventInfo {
    public eventType: eventCh;
    public nickname: string;
    public data: dataTypeCh;

    public constructor(eventType: eventCh, nickname: string, data: dataTypeCh) {
        this.eventType = eventType;
        this.nickname = nickname;
        this.data = data;
    }

    public toString(): string {
        const json = JSON.stringify(this);
        return json;
    }
    
    public static fromJson(data: string): EventInfo {
        const eventInfo = JSON.parse(data) as EventInfo;
        return eventInfo;
    }
}