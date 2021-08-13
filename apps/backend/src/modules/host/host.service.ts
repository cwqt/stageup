import { Service } from 'typedi';
import { ModuleService } from '@core/api';

@Service()
export class HostService extends ModuleService {
  constructor() {
    super();
  }
}
