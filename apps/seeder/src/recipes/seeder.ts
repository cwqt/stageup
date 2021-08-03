import {
  AssetGroup,
  Claim,
  ContactInfo,
  Host,
  Onboarding,
  Performance,
  Person,
  Ticket,
  User,
  UserHostInfo
} from '@core/api';
import { sample } from '@core/helpers';
import {
  BusinessType,
  CountryCode,
  DtoCreateHost,
  HostPermission,
  IHostBusinessDetails,
  PersonTitle,
  Visibility
} from '@core/interfaces';
import * as faker from 'faker';
import Stripe from 'stripe';
import { SeederProviderMap } from '.';
import hostMockData from './mock/hosts.mock';
import performanceMockData, { allTickets, SeedMockPerformance } from './mock/performances.mock';

export class Seeder {
  private stripeCustomer: Stripe.Customer;

  constructor(private providers: SeederProviderMap) {}

  async run() {
    this.stripeCustomer = await this.providers.stripe.connection.customers.create({
      description: 'Stripe test customer'
    });

    await Promise.all(
      hostMockData.map(async (hostData, idx) => {
        // 1st user should be admin@stageup.uk : helloworld
        const user = await this.createUser(
          idx == 0 ? 'admin@stageup.uk' : undefined,
          idx == 0 ? 'helloworld' : undefined
        );

        const host = await this.createHost(hostData);
        await this.addUserToHost(user, host, HostPermission.Owner);

        for (let i = 0; i < 5; i++) {
          const user = await this.createUser();
          await this.addUserToHost(user, host, HostPermission.Member);
        }

        // For every performance on this host account, create some performances
        const hostPerformances = performanceMockData.filter(
          // We've assigned each mock performance an username to which host it is associated with
          // so that for e.g. Rubicon Dance can have dance performances, and National Theatre
          // has Theatre performances etc.
          performance => performance.hostusername == hostData.username
        );
        const performances = await Promise.all(hostPerformances.map(p => this.createPerformance(host, p)));

        // For each performance created, make some tickets
        for await (let performance of performances) {
          const tickets = [];
          // Create between 1-5 tickets for this performance
          for (let i = 0; i < faker.datatype.number({ min: 1, max: 5 }); i++) {
            tickets.push(this.createTicket(performance));
          }

          // Wait for them all to save to the DB before moving onto the next performance
          await Promise.all(tickets);
        }
      })
    );

    console.log('Ran User and host seeder!');
  }

  private async createPerformance(host: Host, mock: SeedMockPerformance) {
    const performance = new Performance(mock, host);
    performance.thumbnail = mock.thumbnail;
    performance.visibility = Visibility.Public;

    const assetGrp = await new AssetGroup(performance._id).save();
    performance.asset_group = assetGrp;
    return await performance.save();
  }

  private async createTicket(performance: Performance): Promise<Ticket> {
    const ticket = new Ticket(sample(allTickets));
    ticket.performance = performance;

    const claim = new Claim();
    await claim.save();
    ticket.claim = claim;

    return await ticket.save();
  }

  private async createHost(hostData: DtoCreateHost & { avatar: string; banner: string }): Promise<Host> {
    const host = new Host({
      name: hostData.name,
      username: hostData.username,
      email_address: hostData.email_address
    });
    await host.save();

    host.onboarding_process = await new Onboarding(host, host.owner).save();

    host.is_onboarded = true;
    host.stripe_account_id = 'acct_1Iimp3FMVjDWWJf3';
    host.avatar = hostData.avatar;
    host.banner = hostData.banner;

    const bd: IHostBusinessDetails = {
      business_type: BusinessType.Company,
      business_address: {
        line1: 'A road',
        city: 'Bristol',
        country: CountryCode.GB,
        postal_code: 'BS12TD'
      },
      business_contact_number: '+441257651423'
    };

    host.business_details = bd;

    return await host.save();
  }

  private async addUserToHost(user: User, host: Host, permission: HostPermission = HostPermission.Member) {
    const member = user;
    member.host = host;

    if (permission == HostPermission.Owner) {
      host.owner = member;
      await host.save();
    }

    const uhi = new UserHostInfo(member, host, permission);
    await uhi.save();
  }

  private async createUser(email?: string, password?: string, username?: string): Promise<User> {
    const user = new User({
      username: username ?? faker.internet.userName(),
      email_address: email ?? faker.internet.email(),
      password: 'helloworld',
      stripe_customer_id: this.stripeCustomer.id
    });

    user.personal_details = new Person({
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      title: PersonTitle.Mr
    });

    await user.personal_details.save();

    user.personal_details.contact_info = new ContactInfo({
      mobile_number: null,
      landline_number: null,
      addresses: []
    });

    await user.personal_details.contact_info.save();

    return await user.save();
  }
}
