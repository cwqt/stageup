describe('Logger', () => {
  test.todo('please pass');
});

// import { IHost, IPerformance, IUser } from '@core/interfaces';
// import { Stories } from '../../stories';
// import { UserType } from '../../environment';
// import { CurrencyCode } from '@eventi/interfaces/lib/Common/Currency.types';

// describe('As a user, I want to be able to do purchase performance', () => {
//   let host: IHost;
//   let perf: IPerformance;
//   let client: IUser;

//   it('Should purchase a performance', async () => {
//     client = await Stories.actions.users.createUser(UserType.Client);
//     await Stories.actions.common.switchActor(UserType.Client);
//     await Stories.actions.common.setup();
//     host = await Stories.actions.hosts.createHost({
//       username: 'somecoolhost',
//       name: 'Some Cool Host',
//       email_address: 'host@cass.si',
//     });

//     perf = await Stories.actions.performances.createPerformance({
//       name: 'Shakespeare',
//       description: 'To be or not to be.',
//     });

//     await Stories.actions.performances.purchase(perf);
//   });
// });
