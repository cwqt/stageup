import { timestamp } from '@core/helpers';
import {
  CurrencyCode,
  Genre,
  IHost,
  IPerformance,
  ITicket,
  ITicketStub,
  IUser,
  PerformanceType,
  TicketType
} from '@core/interfaces';
import { UserType } from '../../environment';
import { Stories } from '../../stories';

let perf: IPerformance;
let host: IHost;
let tickets: ITicketStub[];
let ticket: ITicket;
let owner: IUser & { email_address: string };

describe('As a user-host, I want to CRUD performance tickets', () => {
  beforeAll(async () => {
    await Stories.actions.common.setup();
    owner = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);

    host = await Stories.actions.hosts.createOnboardedHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });
  });

  it('Should connect to stripe', async () => {
    await Stories.actions.common.switchActor(UserType.Owner);
    await Stories.actions.hosts.connectStripe(host);
  });

  it('Should create a performance', async () => {
    perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Shakespeare',
      description: 'To be or not to be',
      genre: Genre.Dance,
      type: PerformanceType.Vod,
      publicity_period: { start: timestamp(), end: timestamp() + 10000000 },
    });
  });

  it('Should create a paid ticket on a performance', async () => {
    ticket = await Stories.actions.performances.createTicket(perf, {
      name: 'Test ticket',
      amount: 10,
      type: TicketType.Paid,
      currency: CurrencyCode.GBP,
      quantity: 100,
      start_datetime: timestamp(),
      end_datetime: timestamp() + 10000000,
      is_visible: true,
      is_quantity_visible: true,
      // dono_pegs: []
    });

    expect(ticket._id).toBeTruthy();
  });

  // TODO: fix the test below

  // it('Should allow a admin to update a ticket', async () => {
  //   await Stories.actions.common.switchActor(UserType.SiteAdmin);
  //   ticket = await Stories.actions.performances.updateTicket(perf, ticket, {
  //     name: 'very cool ticket',
  //     amount: 100,
  //     dono_pegs: ['lowest', 'medium', 'allow_any']
  //   });

  //   expect(ticket.version).toEqual(1); //version 2
  //   // Should softRemove old ticket & replace with new ticket
  //   const tickets = await Stories.actions.performances.readTickets(perf);
  //   expect(tickets.data.length).toEqual(1);
  //   expect(tickets[0]._id).toEqual(ticket._id);
  // });

  it('Should allow a User to get a list of all performance tickets', async () => {
    // Create another performance to get more than 1
    ticket = await Stories.actions.performances.createTicket(perf, {
      name: 'Test ticket 2',
      amount: 4,
      type: TicketType.Free,
      currency: CurrencyCode.GBP,
      quantity: 0,
      start_datetime: timestamp(),
      end_datetime: timestamp() + 1000,
      is_visible: true,
      // dono_pegs: [],
      is_quantity_visible: true
    });

    tickets = await Stories.actions.performances.getTickets(perf);

    expect(tickets).toHaveLength(2);
    expect(tickets.find(t => t.name == ticket.name).type).toEqual(ticket.type);
  });

  it('Should allow a Host Admin to delete a ticket', async () => {
    // Delete ticket, refectch & should be only one remaining
    await Stories.actions.performances.deleteTicket(perf, ticket);
    tickets = await Stories.actions.performances.getTickets(perf);
    expect(tickets).toHaveLength(1);
  });

  // it('Should create a donation ticket on a performance', async () => {
  //   ticket = await Stories.actions.performances.createTicket(perf, {
  //     name: 'Test Dono ticket',
  //     amount: 10,
  //     type: TicketType.Donation,
  //     currency: CurrencyCode.GBP,
  //     quantity: 100,
  //     start_datetime: timestamp(),
  //     end_datetime: timestamp() + 1000,
  //     is_visible: true,
  //     is_quantity_visible: true,
  //     // dono_pegs: ['lowest', 'medium', 'allow_any']
  //   });

  //   expect(ticket.dono_pegs.includes('lowest')).toBeTruthy();
  //   expect(ticket.dono_pegs.includes('medium')).toBeTruthy();
  //   expect(ticket.dono_pegs.includes('highest')).toBeFalsy();
  //   expect(ticket.dono_pegs.includes('allow_any')).toBeTruthy();
  // });

  // TODO: the test below had been changed, now you have to upload photos to be able to toggle a performance to be visible

  // it('Should toggle the performance visibility and then check the visibility flag has been set', async () => {
  //   await Stories.actions.performances.bulkUpdateTicketQtyVisibility(perf, false);

  //   tickets = await Stories.actions.performances.getTickets(perf);
  //   expect(tickets[0].is_quantity_visible).toBeFalsy();
  // });
});
