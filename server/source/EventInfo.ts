import { dataTypeCh, eventCh } from "./types";

export class EventInfo {
  public readonly eventType: eventCh;
  public port: number;
  public readonly data: dataTypeCh;

  public constructor(
    eventType: eventCh = "",
    data: dataTypeCh = "",
    port: number = 1333
  ) {
    this.eventType = eventType;
    this.port = port;
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
