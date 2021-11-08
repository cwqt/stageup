import { IHost } from '@core/interfaces';
import { Stories } from '../../stories';
import { createReadStream } from 'fs';
import fd from 'form-data';

describe('As a user-host, I want to be able to update the host profile banner', () => {
  let host: IHost;

  it('Should create a host', async () => {
    await Stories.actions.common.setup();
    host = await Stories.actions.hosts.createHost({
      username: 'somecoolhost',
      name: 'Some Cool Host',
      email_address: 'host+test@stageup.uk'
    });
  });

  it('Should read the host by id & username', async () => {
    await Stories.actions.hosts.readHost(host);
    await Stories.actions.hosts.readHostByUsername(host);
  });

  it('Should upload a host banner to AWS S3 and check for a returned object URL', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/cat.jpg`);
    const form = new fd();
    form.append('file', createReadStream(filePath));

    const h = await Stories.actions.hosts.changeBanner(host, form);
    expect(typeof h.banner).toEqual('string');
  });

  it('Should delete a host banner', async () => {
    const form = new fd(null);
    const h = await Stories.actions.hosts.changeBanner(host, form);
    expect(typeof h.banner).toBeNull;
  });
});
