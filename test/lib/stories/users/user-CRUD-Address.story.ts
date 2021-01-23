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
    let addressReader = await Stories.actions.users.readAddresses(client, address);
    expect(addressReader).to.not.be.null;
    expect(addressReader.city).to.equal(address.city);
    expect(addressReader.iso_country_code).to.equal(address.iso_country_code);
    expect(addressReader.postcode).to.equal(address.postcode);
    expect(addressReader.street_name).to.equal(address.street_name);
    expect(addressReader.street_number).to.equal(address.street_number);
         
  });

  it('Should update the user address', async () => {
     let updateAdds = await Stories.actions.users.updateAddresses(client, {
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

  it('Should delete the user address', async () => {
    await Stories.actions.users.deleteAddresses(client);
  }); 
})


