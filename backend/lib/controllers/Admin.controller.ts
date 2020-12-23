import { Request } from 'express';
import { validate } from '../common/validate';

import config from '../config';
import { ErrorHandler } from '../common/errors';
import { HostOnboardingStep, HTTP, IEnvelopedData, IHostOnboardingProcess, IOnboardingIssue } from '@eventi/interfaces';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../authorisation';
import { body, param } from 'express-validator';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';
import { createPagingData } from '../common/paginator';

export default class AdminController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  readOnboardingProcesses():IControllerEndpoint<IEnvelopedData<IHostOnboardingProcess[], void>> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async (req:Request):Promise<IEnvelopedData<IHostOnboardingProcess[], void>> => {
        // const onboarding



        return {
          data: [],
          __paging_data: createPagingData(req.path, 0, 0)
        }
      }
    }
  }

  createOnboardingStepIssues():IControllerEndpoint<void> {
    return {
      validator: validate([
        param('step').toInt().isIn(Object.values(HostOnboardingStep)),
        body().isArray(), // validate IOnboardingIssue[]
        body("*.param").notEmpty().isString(),
        body("*.message").notEmpty().isString(),
      ]),
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async (req:Request) => {
        const onboarding = await HostOnboardingProcess.findOne({
          where: {
            host: {
              _id: parseInt(req.params.hid),
            },
          },
        });
        if (!onboarding) throw new ErrorHandler(HTTP.NotFound);

        const issues:IOnboardingIssue[] = req.body;
        issues.forEach(i => i = {...i, version: onboarding.version });
        onboarding.steps[parseInt(req.params.step) as HostOnboardingStep].issues = issues;
        
        await onboarding.save();
      }
    }
  }

  verifyOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async (req: Request): Promise<void> => {},
    };
  }

  enactOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {},
    };
  }
}
