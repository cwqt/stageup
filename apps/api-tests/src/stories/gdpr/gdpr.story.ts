import { timestamp } from '@core/helpers';
import { Genre, IHost, IUser, IPerformance, PerformanceType, Visibility } from '@core/interfaces';
import fd from 'form-data';
import { createReadStream } from 'fs';
import { UserType } from '../../environment';
import { Stories } from '../../stories';

describe('Test all the gdpr controller methods', () => {
  let host: IHost;
  let performance: IPerformance;

  beforeAll(async () => {
    await Stories.actions.common.setup();

    host = await Stories.actions.hosts.createOnboardedHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host@cass.si'
    });

    performance = await Stories.actions.performances.createPerformance(host._id, PerformanceType.Vod);

    const performanceDetails = {
      name: 'Shakespeare',
      short_description: 'To be or not to be',
      long_description: 'That is the question',
      genre: Genre.Dance,
      publicity_period: { start: timestamp(), end: timestamp() + 10000000 },
      visibility: Visibility.Public
    };
    performance = await Stories.actions.performances.updatePerformance(performance._id, performanceDetails);
  });

  it('Should upload a document', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/dummy.pdf`);

    const form1 = new fd();
    form1.append('file', createReadStream(filePath));
    await Stories.actions.gdpr.uploadDocument('cookies', form1);

    const form2 = new fd();
    form2.append('file', createReadStream(filePath));
    await Stories.actions.gdpr.uploadDocument('general_toc', form2);

    const form3 = new fd();
    form3.append('file', createReadStream(filePath));
    await Stories.actions.gdpr.uploadDocument('privacy_policy', form3);
  });

  it('Should read the uploaded document', async () => {
    const document = await Stories.actions.gdpr.readLatestDocument('privacy_policy');
    expect(document.type).toEqual('privacy_policy');
  });

  it('Should read all the latest uploaded document', async () => {
    const documents = await Stories.actions.gdpr.readAllLatestDocuments();
    expect(documents.length).toEqual(3);
  });

  it('Should update stream compliance', async () => {
    await Stories.actions.gdpr.updateStreamCompliance(true, host._id, performance._id);

    // TODO: read this back somehow
  });
});
