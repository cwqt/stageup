import { Inject, Service } from 'typedi';
import { ModuleEvents } from '@core/api';

import { MyselfService } from './myself.service';

@Service()
export class MyselfEvents extends ModuleEvents {
  constructor(private myselfService: MyselfService) {
    super();
    this.events = {};
  }
}
