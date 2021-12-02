import { IHost, IPerformance, IUser, CurrencyCode, Genre, PerformanceType, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { timeout, timestamp } from '@core/helpers';

jest.setTimeout(30000); // 30 sec timeout to create 5 performancess

const PAGES = 3;

describe('As a user, I want to be able to paginate result of a search', () => {
  let host: IHost;
  let performances: IPerformance[] = [];
  let client: IUser;

  it(`Should create a host and create ${PAGES} different performances`, async () => {
    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);

    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'somecoolhost',
      email_address: 'host+test@stageup.uk'
    });

    for (let i = 0; i < PAGES; i++) {
      let perf = await Stories.actions.performances.createPerformance(host._id, PerformanceType.Vod);
      const performanceDetails = {
        name: `Shakespeare${i}`,
        short_description: 'To be or not to be',
        long_description: 'That is the question',
        genre: Genre.Classical,
        publicity_period: { start: timestamp(), end: timestamp() + 10000000 },
        visibility: Visibility.Public
      };
      perf = await Stories.actions.performances.updatePerformance(perf._id, performanceDetails);

      performances.push(perf);
      await timeout(1000);
    }
  });

  it(`Should test the pagination result is correct for all ${PAGES} pages`, async () => {
    for (let i = 0; i < PAGES; i++) {
      const results = await Stories.actions.search.search('Shakespeare', i, 1);
      const paging = results.performances.__paging_data;
      const data = results.performances.data;

      expect(Number(paging.current_page)).toEqual(i);

      expect(data.length).toEqual(1); // page_size of 1
      expect(paging.total).toEqual(performances.length);

      if (i == 0) {
        // 1st, first page
        expect(paging.prev_page).toBeNull;
      } else if (i == 4) {
        // 5th, last page
        expect(paging.next_page).toBeNull;
      } else {
        expect(Number(paging.prev_page)).toEqual(i - 1);
        expect(Number(paging.next_page)).toEqual(i + 1);
      }
    }
  });
});
