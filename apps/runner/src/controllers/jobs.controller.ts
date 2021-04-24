import { IJob, JobType } from '@core/interfaces';
import { Auth, BaseController, IControllerEndpoint, body } from '@core/api';
import { RunnerProviderMap } from '..';
import { QueueMap } from '../common/queues';

export default class JobController extends BaseController<RunnerProviderMap> {
  enqueue(queues: QueueMap): IControllerEndpoint<void> {
    return {
      validators: [
        body<IJob>({
          type: v => v.isIn(Object.values(JobType)),
          data: v => v.exists()
        })
      ],
      authStrategy: Auth.none,
      controller: async req => {
        const job: IJob = req.body;
        queues[job.type].queue.add(job.type, job.data, job.options || {});

        return;
      }
    };
  }
}
