import { IPerformance } from "../performances/performance.interface";
import { JobsOptions } from 'bullmq';

export enum JobType {
  SendEmail = "send_email",
  ScheduleRelease = "schedule_release"
}

export interface IJob<T> {
  type: JobType;
  data: T;
  options?: JobsOptions
}

export type IScheduleReleaseJobData = Required<Pick<IPerformance, "_id">>;
