import { Environment } from "@core/interfaces";
import { BaseController, IControllerEndpoint } from "@core/shared/api";
import Auth from '../common/authorisation';

export default class MiscController extends BaseController {
  ping(): IControllerEndpoint<string> {
    return {
      authStrategy: Auth.not(Auth.isEnv(Environment.Production)),
      controller: async () => {
        return 'Pong!';
      }
    };
  }
}