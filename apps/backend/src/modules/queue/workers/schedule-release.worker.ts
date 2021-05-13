// import { IScheduleReleaseJobData, JobType, Visibility } from '@core/interfaces';
// import { Worker } from 'bullmq';

// FIXME: this needs fixing
// export default () => {
//   return new Worker(JobType.ScheduleRelease, async job => {
//     const data: IScheduleReleaseJobData = job.data;
//     await api.put(`${Env.API_URL}/performances/${data._id}/visibility`, { visibility: Visibility.Public });
//   }, {
//     connection: {
//       host: Env.REDIS.host,
//       port: Env.REDIS.port
//     }
//   });
// };
