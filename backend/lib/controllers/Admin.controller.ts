import { ErrorHandler } from '../common/errors';
import { HostOnboardingStep, HTTP, IEnvelopedData, IHostOnboarding, IHostOnboardingProcess, IOnboardingIssue } from '@eventi/interfaces';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';
import { params, body, array } from '../common/validate';
import Validators from '../common/validate';

import { HostOnboardingState } from '@eventi/interfaces';

export default class AdminController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  // ------------------------------------------------------------------------------------------------

  readOnboardingProcesses(): IControllerEndpoint<IEnvelopedData<IHostOnboarding[], null>> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {

        const state =  HostOnboardingState;
        //const host_name =  req.query.host_name;
        //const submission_date_sort = req.params.submission_date_sort;
        
       // Chaining functions using the example provided:
        const onboardingEnvelope = await this.ORM.createQueryBuilder(HostOnboardingProcess, 'hop')
          .innerJoinAndSelect('hop.host', 'host') // Joining tables
          .where('hop.state = :state', { state: req.params.state ?? '%'}) // Filter by state
          .andWhere('host.name like :hostName', { hostName: req.query.host_name }) // One host_name? or many?
          .orderBy('hop.last_submitted', ( req.params.submission_date_sort ?? 'DESC')) // Descending order
          .paginate();
        
        return {
          data: onboardingEnvelope.data.map(o => o.toFull()),
          __paging_data: onboardingEnvelope.__paging_data,

        }
      }
    }
  }

  // ------------------------------------------------------------------------------------------------

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
      controller: async req => {},
    };
  }

  /**
   * @description Merge the Hosts Onboarding Process with the host
   */
  enactOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {},
    };
  }
}
