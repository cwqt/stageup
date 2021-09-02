import { Service } from 'typedi';
import { ModuleController } from '@core/api';

@Service()
export class FinanceController extends ModuleController {
  constructor() {
    super();
  }
}
