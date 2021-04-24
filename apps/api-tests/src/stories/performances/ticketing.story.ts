import { IHost, IPerformance, ITicket, ITicketStub, TicketFees, TicketType } from '@core/interfaces';
import { Stories } from '../../stories';
import { CurrencyCode, Genre } from '@core/interfaces';
import { timestamp } from '@core/helpers';

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

  it('Should create a paid ticket on a performance', async () => {
    ticket = await Stories.actions.performances.createTicket(perf, {
      name: 'Test ticket',
      amount: 10,
      type: TicketType.Paid,
      currency: CurrencyCode.GBP,
      quantity: 100,
      fees: TicketFees.Absorb,
      start_datetime: timestamp(),
      end_datetime: timestamp() + 1000,
      is_visible: true,
      is_quantity_visible: true,
      dono_pegs: []
    });

    expect(ticket._id).toBeTruthy();
  });

  it('Should allow a admin to update a ticket', async () => {
    ticket = await Stories.actions.performances.updateTicket(perf, ticket, {
      name: 'very cool ticket',
      amount: 100,
      dono_pegs: ['lowest', 'medium', 'allow_any']
    });

    expect(ticket.version).toEqual(1); //version 2
    // Should softRemove old ticket & replace with new ticket
    const tickets = await Stories.actions.performances.readTickets(perf);
    expect(tickets.length).toEqual(1);
    expect(tickets[0]._id).toEqual(ticket._id);
  });

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
      is_visible: true,
      dono_pegs: [],
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

  it('Should create a donation ticket on a performance', async () => {
    ticket = await Stories.actions.performances.createTicket(perf, {
      name: 'Test Dono ticket',
      amount: 10,
      type: TicketType.Donation,
      currency: CurrencyCode.GBP,
      quantity: 100,
      fees: TicketFees.Absorb,
      start_datetime: timestamp(),
      end_datetime: timestamp() + 1000,
      is_visible: true,
      is_quantity_visible: true,
      dono_pegs: ['lowest', 'medium', 'allow_any']
    });

    expect(ticket.dono_pegs.includes('lowest')).toBeTruthy();
    expect(ticket.dono_pegs.includes('medium')).toBeTruthy();
    expect(ticket.dono_pegs.includes('highest')).toBeFalsy();
    expect(ticket.dono_pegs.includes('allow_any')).toBeTruthy();
  });

  it('Should toggle the performance visibility and then check the visibility flag has been set', async () => {
    await Stories.actions.performances.bulkUpdateTicketQtyVisibility(perf, false);

    tickets = await Stories.actions.performances.getTickets(perf);
    expect(tickets[0].is_quantity_visible).toBeFalsy();
  });
});
