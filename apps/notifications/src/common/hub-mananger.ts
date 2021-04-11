import { SseEvent, SseEventType } from "@core/interfaces";
import { Hub } from "@toverux/expresse";
import { Logger } from 'winston';

export class HubManager {
  private log: Logger;
  private hubs: { [index: string]: Hub };

  constructor(log: Logger) {
    this.log = log;
    this.hubs = {};
  }

  create(id: string) {
    this.log.debug(`Created Hub: ${id}`);
    this.hubs[id] = new Hub();
    return this.hubs[id];
  }

  destroy(id: string) {
    this.emit(id, { type: SseEventType.Disconnected });
    delete this.hubs[id];
    this.log.debug(`Destroyed hub: ${id}`);
  }

  emit<T>(id: string, event: SseEvent<T>) {
    this.get(id).data(event);
  }

  get(id: string) {
    return this.hubs[id];
  }

  getTotalClientCount(): { [index: string]: number } {
    return Object.keys(this.hubs).reduce((acc, curr) => {
      acc[curr] = (this.hubs[curr]['clients'] as Set<any>).size;
      return acc;
    }, {});
  }
}