import { describe, it } from 'mocha';
import { expect } from 'chai';
import { IUser, IAddress } from '@eventi/interfaces';
import { Stories } from '../../stories';
import { UserType } from '../../environment';

describe("User addresses CRUD", () => {
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
      street_number: 32,
    });

      expect(address.city).to.equal('Cardiff');
      expect(address.iso_country_code).to.equal('GBR');
      expect(address.postcode).to.equal('NE62 5DE');
      expect(address.street_name).to.equal('Marquee Court');
      expect(address.street_number).to.equal(32);         
  }); 

  it('Should read the users addresses', async () => {
    let addressReader = await Stories.actions.users.readAddresses(client);
    expect(addressReader).to.not.be.null;
    expect(addressReader[0].city).to.equal(address.city);
    expect(addressReader[0].iso_country_code).to.equal(address.iso_country_code);
    expect(addressReader[0].postcode).to.equal(address.postcode);
    expect(addressReader[0].street_name).to.equal(address.street_name);
    expect(addressReader[0].street_number).to.equal(address.street_number);
         
  });

  it('Should update the user address', async () => {
     let updateAdds = await Stories.actions.users.updateAddress(client, address, {
      city: 'Aberystwyth',
      iso_country_code: 'GBR',
      postcode: 'SY23 3QQ',
      street_name: 'Maesceinion',
      street_number: 29,
      });

      expect(address.city).to.equal(updateAdds.city);
      expect(address.iso_country_code).to.equal(updateAdds.iso_country_code);
      expect(address.postcode).to.equal(updateAdds.postcode);
      expect(address.street_name).to.equal(updateAdds.street_name);
      expect(address.street_number).to.equal(updateAdds.street_number);  
  });

  it('Should delete the user address', async () => {
    await Stories.actions.users.deleteAddress(client, address);
    let chkAddress = await Stories.actions.users.readAddresses(client);
    expect(chkAddress).to.be.lengthOf(0);
  }); 
})


