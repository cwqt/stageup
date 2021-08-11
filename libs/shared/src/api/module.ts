import { Token } from 'typedi';
import { Contract, Event } from './contracts';

interface Constructable<T> {
  new (...args: any): T;
}

export interface Module {
  name: string;
  events?: Constructable<ModuleEvents>;
}

export abstract class ModuleService {}
export abstract class ModuleController {}
export abstract class ModuleEvents<T extends Event = Event, NeedsAll extends boolean = false> {
  // NeedsAll for forcing ModuleEvents to have handlers for all in a union
  // see mux.events.ts for example
  events: NeedsAll extends true
    ? { [index in T]: (ct: Contract<index>) => any }
    : { [index in T]?: (ct: Contract<index>) => any };

  constructor() {}
}
