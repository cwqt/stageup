import { ModuleService } from '@core/api';
import { Service } from 'typedi';

@Service()
export class MyselfService extends ModuleService {
  constructor() {
    super();
  }
}
