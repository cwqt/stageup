import { ErrorHandler, getCheck } from '../common/errors';
import {
  HostOnboardingState,
  HostOnboardingStep,
  HTTP,
  IEnvelopedData,
  IHostOnboarding,
  IHostOnboardingProcess,
  IOnboardingIssue,
} from '@eventi/interfaces';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';
import { params, body, array } from '../common/validate';
import Validators from '../common/validate';

export default class AdminController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  readOnboardingProcesses(): IControllerEndpoint<IEnvelopedData<IHostOnboarding[], null>> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const onboardingEnvelope = await this.ORM.createQueryBuilder(HostOnboardingProcess, 'hop').paginate();

        return {
          data: onboardingEnvelope.data.map(o => o.toFull()),
          __paging_data: onboardingEnvelope.__paging_data,
        };
      },
    };
  }

  createOnboardingStepIssues(): IControllerEndpoint<void> {
    return {
      validators: [
        params({
          step: v => v.exists().toInt().isIn(Object.values(HostOnboardingStep)),
        }),
        body({
          __this: v =>
            v.isArray().custom(
              array({
                param: v => Validators.Fields.isString(v),
                message: v => Validators.Fields.isString(v),
              })
            ),
        }),
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

        const issues: IOnboardingIssue[] = req.body;
        issues.forEach(i => (i = { ...i, version: onboarding.version }));
        onboarding.steps[parseInt(req.params.step) as HostOnboardingStep].issues = issues;

        await onboarding.save();
      },
    };
  }

  reviewStep():IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {}
    }
  }

  /**
   * @description Merge the Hosts Onboarding Process with the host
   */
  submitOnboardingProcess(): IControllerEndpoint<void> {
    return {
      validators: [
        body<{status: HostOnboardingState}>({
          status: v => v.isIn(Object.values(HostOnboardingState))
        })
      ],
      authStrategy: AuthStrat.isSiteAdmin,
      controller: async req => {
        const onboarding = await getCheck(HostOnboardingProcess.findOne({_id: parseInt(req.params.oid) }));
        if(req.body.status == HostOnboardingState.Enacted) await onboarding.enact();
        
        if(req.body.status == HostOnboardingState.HasIssues) {

        }
      },
    };
  }
}
