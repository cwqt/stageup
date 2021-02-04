import { IUser, IAddress } from '@core/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';

describe('User addresses CRUD', () => {
  let client: IUser;
  let address: IAddress;

  it('Should add a new address for the user', async () => {
    await Stories.actions.common.setup();
    client = await Stories.actions.users.createUser(UserType.Client);
    await Stories.actions.common.switchActor(UserType.Client);
    address = await Stories.actions.users.createAddress(client, {
      city: 'Cardiff',
      iso_country_code: 'GBR',
      postcode: 'NE62 5DE',
      street_name: 'Marquee Court',
      street_number: 32
    });

    expect(address.city).toBe('Cardiff');
    expect(address.iso_country_code).toBe('GBR');
    expect(address.postcode).toBe('NE62 5DE');
    expect(address.street_name).toBe('Marquee Court');
    expect(address.street_number).toBe(32);
  });

  it('Should read the users addresses', async () => {
    const addresses = await Stories.actions.users.readAddresses(client);
    expect(addresses).not.toBeNull();
    expect(addresses[0].city).toBe(address.city);
    expect(addresses[0].iso_country_code).toBe(address.iso_country_code);
    expect(addresses[0].postcode).toBe(address.postcode);
    expect(addresses[0].street_name).toBe(address.street_name);
    expect(addresses[0].street_number).toBe(address.street_number);
  });

  it('Should update the user address', async () => {
    const updatedAddress = await Stories.actions.users.updateAddress(client, address, {
      city: 'Aberystwyth',
      iso_country_code: 'GBR',
      postcode: 'SY23 3QQ',
      street_name: 'Maesceinion',
      street_number: 29
    });

    expect(updatedAddress.city).toBe('Aberystwyth');
    expect(updatedAddress.iso_country_code).toBe('GBR');
    expect(updatedAddress.postcode).toBe('SY23 3QQ');
    expect(updatedAddress.street_name).toBe('Maesceinion');
    expect(updatedAddress.street_number).toBe(29);
  });

  it('Should delete the user address', async () => {
    await Stories.actions.users.deleteAddress(client, address);
    const addresses = await Stories.actions.users.readAddresses(client);
    expect(addresses).toHaveLength(0);
  });
});
