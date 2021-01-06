import { ErrorHandler } from '../common/errors';
import { HostOnboardingStep, HTTP, IEnvelopedData, IHostOnboarding, IHostOnboardingProcess, IOnboardingIssue } from '@eventi/interfaces';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';
import { params, body, array } from '../common/validate';
import Validators from '../common/validate';

export default class AdminController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  // ------------------------------------------------------------------------------------------------

  readOnboardingProcesses(): IControllerEndpoint<IEnvelopedData<IHostOnboarding[], null>> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const onboardingEnvelope = await this.ORM.createQueryBuilder(HostOnboardingProcess, 'hop').paginate();

        const state = await this.ORM.createQueryBuilder("state").where('HostOnboardingState = :status', { status: '1' }).getMany();
        if (!state) throw new ErrorHandler(HTTP.NotFound);

        const submission_date_sort = await this.ORM.createQueryBuilder("submission_date_sort").orderBy('user.submission', 'DESC');

        const host_name = req.query.host_name;
        if (!host_name) throw new ErrorHandler(HTTP.NotFound);
        cdcd angular

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
