import { IHost, IPerformance, ITicket, ITicketStub, TicketFees, TicketType } from '@core/interfaces';
import { Stories } from '../../stories';
import { CurrencyCode, Genre } from '@core/interfaces';
import { timestamp } from '@core/shared/helpers';

describe('As a user-host, I want to CRUD performance tickets', () => {
  let perf: IPerformance;
  let host: IHost;
  let tickets: ITicketStub[];
  let ticket: ITicket;

  it('Should perform initial setup', async () => {
    await Stories.actions.common.setup();

    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si'
    });

    perf = await Stories.actions.performances.createPerformance(host, {
      name: 'Shakespeare',
      description: 'To be or not to be',
      genre: Genre.BourgeoisTragedy,
      premiere_date: null
    });
  });

  it('Should create a ticket on a performance', async () => {
    const ticket = await Stories.actions.performances.createTicket(perf, {
      name: 'Test ticket',
      amount: 10,
      type: TicketType.Paid,
      currency: CurrencyCode.GBP,
      quantity: 100,
      fees: TicketFees.Absorb,
      start_datetime: timestamp(),
      end_datetime: timestamp() + 1000,
      is_visible: true
    });

    expect(ticket._id).toBeTruthy;
  });

  it('Should allow a admin to update a ticket', async () => {});

  it('Should allow a User to get a list of all performance tickets', async () => {
    // Create another performance to get more than 1
    ticket = await Stories.actions.performances.createTicket(perf, {
      name: 'Test ticket 2',
      amount: 4,
      type: TicketType.Free,
      currency: CurrencyCode.GBP,
      quantity: 0,
      fees: TicketFees.PassOntoPurchaser,
      start_datetime: timestamp(),
      end_datetime: timestamp() + 1000,
      is_visible: true
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
});
