import { Request } from 'express';

import config from '../config';
import { ErrorHandler } from '../common/errors';
import { HostOnboardingStep, HTTP, IEnvelopedData, IHostOnboardingProcess, IOnboardingIssue } from '@eventi/interfaces';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../authorisation';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';
import { createPagingData } from '../common/paginator';
import { params, body, array } from '../common/validate';
import Validators from '../common/validators';

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
      validators: [
        params({
          step: (v) => v.exists().toInt().isIn(Object.values(HostOnboardingStep)),
        }),
        body({
          __this: v => v.isArray().custom(array({
            param: v => Validators.Fields.isString(v),
            message: v => Validators.Fields.isString(v),
          }))
        })
      ],
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
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

  /**
   * @description Admin update step - verify / raise issue
   */
  verifyOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async (req: Request): Promise<void> => {},
    };
  }

  /**
   * @description Merge the Hosts Onboarding Process with the host
   */
  enactOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {},
    };
  }
}
