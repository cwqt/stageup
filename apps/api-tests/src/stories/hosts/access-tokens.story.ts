// TODO: update this once the provision logic is in use again

describe.skip('Logger', () => {
  test.todo('update this once the provision logic is in use again');
});

// import {
//   IHost,
//   IMyself,
//   IPerformance,
//   IUser,
//   PerformanceType,
// } from '@core/interfaces';
// import { UserType } from '../../environment';
// import { Stories } from '../../stories';

// describe('As a Host Admin I want to provision performance access tokens', () => {
//   let host: IHost;
//   let performance: IPerformance;
//   let hostAdmin: IUser;
//   let hostMember: IMyself['user'];
//   let randomUser: IMyself['user'];

//   it('Should create a host', async () => {
//     hostAdmin = await Stories.actions.common.setup();
//     host = await Stories.actions.hosts.createHost({
//       username: 'somecoolhost',
//       name: 'Some Cool Host',
//       email_address: 'host+test@stageup.uk'
//     });

//     performance = await Stories.actions.performances.createPerformance(host._id, PerformanceType.Live);
//     performance = await Stories.actions.performances.updatePerformance(performance._id);
//   });

//   it('Should create some test users', async () => {
//     randomUser = await Stories.actions.users.createUser(UserType.Client);
//     hostMember = await Stories.actions.users.createUser(UserType.Member);
//     await Stories.actions.hosts.addMember(host, hostMember);
//   });

//   it('Should provision a token for a host member', async () => {
//     await Stories.actions.hosts.provisionPerformanceAccessTokens(host, performance, {
//       email_addresses: [hostMember.email_address]
//     });
//   });

//   it('Should provision a token for a non-host member', async () => {
//     await Stories.actions.hosts.provisionPerformanceAccessTokens(host, performance, {
//       email_addresses: [randomUser.email_address]
//     });
//   });

//   it('Should NOT provision a token for someone who already has one', async () => {
//     await Stories.actions.hosts.provisionPerformanceAccessTokens(host, performance, {
//       email_addresses: [randomUser.email_address]
//     });
//   });
// });
