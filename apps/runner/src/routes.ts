import { Middlewares, AsyncRouter } from "@core/shared/api";
import { RunnerProviderMap } from ".";
import { QueueMap } from './common/queues';

import JobsController from './controllers/jobs.controller';
import MiscController from './controllers/misc.controller';

export default (queues:QueueMap) => (router:AsyncRouter<RunnerProviderMap>, pm:RunnerProviderMap, mws:Middlewares) => {
  // JOBS ---------------------------------------------------------------------------------------------------------------
  const Jobs = new JobsController(pm, mws);
  router.post <void>    ("/jobs",   Jobs.enqueue(queues));

  // MISC ---------------------------------------------------------------------------------------------------------------
  const Misc = new MiscController(pm, mws);
  router.get  <string>  ("/ping",   Misc.ping());
}
