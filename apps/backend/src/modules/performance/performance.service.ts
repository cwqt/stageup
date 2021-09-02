import { ModuleService } from '@core/api';
import { Service } from 'typedi';

@Service()
export class PerformanceService extends ModuleService {
  constructor() {
  super();
  }
}
