import { IHost, IPerformance, IUser, CurrencyCode, Genre } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';

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
      email_address: 'host@cass.si'
    });

    for (let i = 0; i < PAGES; i++) {
      const perf = await Stories.actions.performances.createPerformance(host, {
        name: `Shakespeare${i}`,
        description: 'To be or not to be',
        genre: Genre.BourgeoisTragedy,
        premiere_date: null
      });

      performances.push(perf);
    }
  });

  it(`Should test the pagination result is correct for all ${PAGES} pages`, async () => {
    for (let i = 0; i < PAGES; i++) {
      const results = await Stories.actions.search.search('Shakespeare', i, 1);
      const paging = results.performances.__paging_data;
      const data = results.performances.data;

      expect(paging.current_page).toEqual(i);

      expect(data.length).toEqual(1); // page_size of 1
      expect(paging.total).toEqual(performances.length);

      if (i == 0) {
        // 1st, first page
        expect(paging.prev_page).toBeNull;
      } else if (i == 4) {
        // 5th, last page
        expect(paging.next_page).toBeNull;
      } else {
        expect(paging.prev_page).toEqual(i - 1);
        expect(paging.next_page).toEqual(i + 1);
      }
    }
  });
});
