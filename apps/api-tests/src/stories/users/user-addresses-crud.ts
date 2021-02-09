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

    expect(address.city).toEqual('Cardiff');
    expect(address.iso_country_code).toEqual('GBR');
    expect(address.postcode).toEqual('NE62 5DE');
    expect(address.street_name).toEqual('Marquee Court');
    expect(address.street_number).toEqual(32);
  });

  it('Should read the users addresses', async () => {
    const addresses = await Stories.actions.users.readAddresses(client);
    
    expect(addresses).not.toBeNull();
    expect(addresses[0].city).toEqual(address.city);
    expect(addresses[0].iso_country_code).toEqual(address.iso_country_code);
    expect(addresses[0].postcode).toEqual(address.postcode);
    expect(addresses[0].street_name).toEqual(address.street_name);
    expect(addresses[0].street_number).toEqual(address.street_number);
  });

  it('Should update the user address', async () => {
    const updatedAddress = await Stories.actions.users.updateAddress(client, address, {
      city: 'Aberystwyth',
      iso_country_code: 'GBR',
      postcode: 'SY23 3QQ',
      street_name: 'Maesceinion',
      street_number: 29
    });

    expect(updatedAddress.city).toEqual('Aberystwyth');
    expect(updatedAddress.iso_country_code).toEqual('GBR');
    expect(updatedAddress.postcode).toEqual('SY23 3QQ');
    expect(updatedAddress.street_name).toEqual('Maesceinion');
    expect(updatedAddress.street_number).toEqual(29);
  });

  it('Should delete the user address', async () => {
    await Stories.actions.users.deleteAddress(client, address);
    const addresses = await Stories.actions.users.readAddresses(client);
    expect(addresses).toHaveLength(0);
  });
});
