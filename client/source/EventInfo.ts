import { dataTypeCh, eventCh } from "./types";

export class EventInfo {
  public eventType: eventCh;
  public port: number = 1333;
  public data: dataTypeCh;

  public constructor(eventType: eventCh, data: dataTypeCh) {
    this.eventType = eventType;
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
