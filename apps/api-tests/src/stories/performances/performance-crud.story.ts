import { ErrCode, HTTP, IErrorResponse, IHost, IPerformance, IUser, CurrencyCode, Genre, Visibility } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { AxiosError } from 'axios';

describe('As a user, I want to be able to do performance CRUD', () => {
  let host: IHost;
  let perf: IPerformance;
  let client: IUser;

  it('Should create a performance and get the newly created performance', async () => {
    await Stories.actions.common.setup();

    client = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si'
    });

    perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Shakespeare',
      description: 'To be or not to be',
      price: 24,
      currency: CurrencyCode.GBP,
      genre: Genre.BourgeoisTragedy,
      premiere_date: null
    });

    expect(perf).not.toBeNull();
    expect(perf.name).toBe('Shakespeare');
    expect(perf.description).toBe('To be or not to be');
    expect(perf.price).toBe(24);
    expect(perf.currency).toBe(CurrencyCode.GBP);
  });

  it("Should read a performance", async () => {
    let p = await Stories.actions.performances.readPerformance(perf);
    expect(p).not.toBeNull();
    //assert relationship pulled in
    expect(p.data.host.username).toEqual(host.username);
  })

  it('Should update a performance', async () => {
    const updatePerf = await Stories.actions.performances.updatePerformance(perf, {
      name: 'Othello',
      description: 'For she had eyes and chose me.',
      price: 24
    });

    expect(updatePerf.name).toBe('Othello');
    expect(updatePerf.description).toBe('For she had eyes and chose me.');
    expect(updatePerf.price).toBe(24);
  });

  describe("Should update performance visibility", () => {
    it("Should assert that the performance is initially set to being Private", async () => {
      expect(perf.visibility).toEqual(Visibility.Private);
    })

    it("Should allow an Admin to update a performance to be Public", async () => {
      perf = await Stories.actions.performances.updateVisibility(perf, Visibility.Public);
      expect(perf.visibility).toEqual(Visibility.Public);
    })

    it("Should NOT allow an Editor to update a performance to now be Private", async () => {
      const editor = await Stories.actions.users.createUser(UserType.Editor);
      await Stories.actions.hosts.addMember(host, editor);
      await Stories.actions.misc.acceptHostInvite(editor);
      await Stories.actions.common.switchActor(UserType.Editor);

      try {
        perf = await Stories.actions.performances.updateVisibility(perf, Visibility.Private)
        expect(perf).toBeUndefined;//will always fail 
      } catch (error) {
        expect(error.response.status).toEqual(HTTP.Unauthorised);
        expect(error.response.data.message).toEqual(ErrCode.MISSING_PERMS);
      }

      // Switch back to host owner
      await Stories.actions.common.switchActor(UserType.Owner);
    })
  })


  it('Should delete a performance', async () => {
    await Stories.actions.performances.deletePerformance(perf);
    try {
      // this should definitely throw a 404 because of the prior delete
      const p = await Stories.actions.performances.readPerformance(perf);
      expect(p).toBeNull();
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.NotFound);
    }
  });
});
