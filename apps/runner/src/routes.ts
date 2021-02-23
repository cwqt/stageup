import { DataClient, Middlewares, AsyncRouter } from "@core/shared/api";
import { RunnerDataClient } from "./common/data";
import { QueueMap } from './common/queues';

import JobsController from './controllers/jobs.controller';
import MiscController from './controllers/misc.controller';

export default (queues:QueueMap) => (router:AsyncRouter, client:DataClient<RunnerDataClient>, mws:Middlewares) => {
  // JOBS ---------------------------------------------------------------------------------------------------------------
  const Jobs = new JobsController(client, mws);
  router.post <void>    ("/jobs",   Jobs.enqueue(queues));

  // MISC ---------------------------------------------------------------------------------------------------------------
  const Misc = new MiscController(client, mws);
  router.get  <string>  ("/ping",   Misc.ping());
}
  