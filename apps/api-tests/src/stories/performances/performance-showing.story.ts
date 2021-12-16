import {
  IHost,
  IPerformance,
  Genre,
  Visibility,
  IMyself,
  PerformanceType,
  DtoPerformanceDetails,
  HTTP,
  DtoCreateShowing,
  DtoCreateMultipleTickets,
  IShowing,
  TicketType,
  CurrencyCode,
  IErrorResponse
} from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';
import { timestamp } from '@core/helpers';
import { AxiosError } from 'axios';

let host: IHost;
let performance: IPerformance;
let owner: IMyself['user'];
let performanceDetails: DtoPerformanceDetails = {
  name: 'Shakespeare',
  short_description: 'To be or not to be',
  long_description: 'That is the question',
  genre: Genre.Dance,
  publicity_period: { start: null, end: null },
  ticket_publicity_period: { start: null, end: null },
  visibility: Visibility.Public
};

const startTime = timestamp();
const endTime = timestamp() + (3600 * 1000 * 2); // + 2h

let showing: IShowing;
let showing2: IShowing;

describe('As a user, I want to be able to create showings for an event', () => {
  beforeAll(async () => {
    await Stories.actions.common.setup();
    owner = await Stories.actions.users.createUser(UserType.Owner);
    await Stories.actions.common.switchActor(UserType.Owner);

    host = await Stories.actions.hosts.createOnboardedHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });

    performance = await Stories.actions.performances.createPerformance(host._id, PerformanceType.Live);
    performance = await Stories.actions.performances.updatePerformance(performance._id, performanceDetails);
  });
  
  it('Should not be able to create a showing for an event which when no event publicity is defined', async () => {
    const data: DtoCreateShowing = {
      start_datetime: startTime,
      end_datetime: endTime,
    }
    
    try {
      showing =  await Stories.actions.performances.createShowing(performance, data);
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.BadRequest);
      expect(
        (error as AxiosError<IErrorResponse>).response?.data.message.includes('@@showing.missing_performance_publicity'))
        .toBe(true);
    }
  });

  it('Should not be able to create a showing for an event which when no ticket publicity is defined', async () => {
    performanceDetails.publicity_period = { start: startTime, end: endTime }
    performance = await Stories.actions.performances.updatePerformance(performance._id, performanceDetails);
    
    const data: DtoCreateShowing = {
      start_datetime: startTime,
      end_datetime: endTime,
    }
    
    try {
      showing =  await Stories.actions.performances.createShowing(performance, data);
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.BadRequest);
      expect(
        (error as AxiosError<IErrorResponse>).response?.data.message.includes('@@showing.missing_ticket_publicity'))
        .toBe(true);
    }
  });

  it('Should add the ticket visibility period to the event', async () => {
    performance = await Stories.actions.performances.updatePerformance(performance._id, {
      ...performanceDetails,
      ticket_publicity_period: { start: startTime, end: endTime +  (3600 * 1000 * 2) + 1}
    });
  });

  it('Should not allow the start time be after the end time', async () => {
    const data: DtoCreateShowing = {
      start_datetime: endTime,
      end_datetime: endTime - 1,
    }
    
    try {
      showing =  await Stories.actions.performances.createShowing(performance, data);
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.BadRequest);
      expect(
        (error as AxiosError<IErrorResponse>).response?.data.message.includes('@@showing.invalid_duration'))
        .toBe(true);
    }
  });

  it('Should not be able to create and showing outside of the event publicity period', async () => {
    const data: DtoCreateShowing = {
      start_datetime: startTime - 1,
      end_datetime: endTime + 1,
    }
    
    try {
      showing =  await Stories.actions.performances.createShowing(performance, data);
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.BadRequest);
      expect(
        (error as AxiosError<IErrorResponse>).response?.data.message.includes('@@showing.time_not_in_ticket_publicity'))
        .toBe(true);
    }
  });

  it('Should create a showings for the event', async () => {    
    const data: DtoCreateShowing = {
      start_datetime: startTime,
      end_datetime: endTime,
    }

    const data2: DtoCreateShowing = {
      start_datetime: endTime + 1,
      end_datetime: endTime + (3600 * 1000 * 2),
    }

    showing =  await Stories.actions.performances.createShowing(performance, data);
    showing2 = await Stories.actions.performances.createShowing(performance, data2);

    expect(showing.performance._id).toEqual(performance._id);
    expect(showing.start_datetime).toEqual(startTime);
    expect(showing.end_datetime).toEqual(endTime);
    expect(showing2.performance._id).toEqual(performance._id);
    expect(showing2.start_datetime).toEqual(data2.start_datetime);
    expect(showing2.end_datetime).toEqual(data2.end_datetime);
  });

  it('Should read the showings of a live event', async () => {
    const showings = await Stories.actions.performances.readShowings(performance);

    expect(showings.length).toEqual(2);
    expect(showings[0].start_datetime).toEqual(startTime);
    expect(showings[0].end_datetime).toEqual(endTime);
  });

  it('Should not be able to add a showing which overlaps with another showing', async () => {
    const data: DtoCreateShowing = {
      start_datetime: startTime,
      end_datetime: endTime,
    }

    try {
      const showing3 =  await Stories.actions.performances.createShowing(performance, data);
    } catch (error) {
      expect((error as AxiosError<IErrorResponse>).response?.status).toBe(HTTP.BadRequest);
      expect(
        (error as AxiosError<IErrorResponse>).response?.data.message.includes('@@showing.overlapping_showings'))
        .toBe(true);
    }
  });

  it('Should create a ticket for a showing', async () => {    
    const ticketsDto: DtoCreateMultipleTickets = {
      showing_ids: [showing._id, showing2._id],
      ticket: {
        name: 'Test ticket',
        amount: 10,
        type: TicketType.Paid,
        currency: CurrencyCode.GBP,
        quantity: 100,
        start_datetime: timestamp(),
        end_datetime: timestamp() + 10000000,
        is_visible: true,
        is_quantity_visible: true
      }
    };

    const tickets = await Stories.actions.performances.createMultipleTickets(
      performance,
      ticketsDto
    );

    expect(tickets.length).toEqual(2);
  });

  it('Should read the tickets of a showing', async () => {
    const tickets = await Stories.actions.performances.readShowingTickets(performance, showing);
    expect(tickets.data.length).toEqual(1);
  });
});
