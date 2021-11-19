import { PasswordReset } from '@core/api';
import {
  CountryCode,
  IAddress, IHost, IUser
} from '@core/interfaces';
import fd from 'form-data';
import { createReadStream } from 'fs';
import { environment, UserType } from '../../environment';
import { Stories } from '../../stories';

describe('Test all the user controller methods', () => {
  let user: IUser & {email_address: string};
  let owner: IUser & {email_address: string};
  let admin: IUser;
  let host: IHost;
  let address: IAddress;

  beforeAll(async () => {
    await Stories.actions.common.setup();
    admin = await Stories.actions.users.createUser(UserType.Admin);
    Stories.actions.common.switchActor(UserType.Admin);
    host = await Stories.actions.hosts.createHost({
      username: 'hostname',
      name: 'host name',
      email_address: 'host@email.com'
    });
  });

  it('Should create a user', async () => {
    // Create user with the following data:
    // Email: 'eventiclient@stageup.uk', username: 'hostclient', password: 'hostclient'
    user = await Stories.actions.users.createUser(UserType.Client);

    expect(user.username).toEqual('hostclient');
    expect(user.email_address).toEqual('eventiclient@stageup.uk');
  });

  it('Should log in the newly created user', async () => {
    // The log in and log out are implicitly tested just by using Stories.actions.common.setup();
    // This method is a more explicit way of showing it works and passes
    
    // Make sure previously logged in users are logged out
    await Stories.actions.users.logout();
    // Log in our user
    // Only expect this method not to fail
    await Stories.actions.users.login(UserType.Client);
    await Stories.actions.common.switchActor(UserType.Client);
  });

  it('Should read the newly created user', async () => {
    const readUser = await Stories.actions.users.readUser(user);

    expect(readUser._id).toEqual(user._id);
    expect(readUser.username).toEqual(user.username);
  });

  it('Should update the user', async () => {
    user.bio = 'This is my bio';
    await Stories.actions.users.updateUser(
      user,
      { 
        bio: user.bio,
        email_address: user.email_address,
        name: user.name
      }
    );
    const readUser = await Stories.actions.users.readUser(user);

    expect(readUser.bio).toEqual(user.bio);
  });

  it('Should upload a profile picture to Google Cloud Storage and check for a returned object URL', async () => {
    const filePath = require('path').join(__dirname, `./../../../assets/cat.jpg`);
    const form = new fd();
    form.append('file', createReadStream(filePath));
    const pictureUrl = await Stories.actions.users.changeAvatar(user, form);

    expect(typeof pictureUrl).toEqual('string');
    expect(pictureUrl.includes('https://storage.googleapis.com/')).toBe(true);
    expect(pictureUrl.includes('.jpg')).toBe(true);
  });

  it('Should read host info of the user', async () => {
    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    await Stories.actions.hosts.addMember(host, user);

    await Stories.actions.common.switchActor(UserType.Client);
    const hostInfo = await Stories.actions.users.readUserHost(user);

    expect(hostInfo.data.username).toEqual(host.username);
    expect(hostInfo.data.name).toEqual(host.name);

    // Delete the membership to be able to delete the user later
    await Stories.actions.common.switchActor(UserType.SiteAdmin);
    await Stories.actions.hosts.removeMember(host, user);

    await Stories.actions.common.switchActor(UserType.Client);
  });

  it('Should add a new address for the user', async () => {
    address = await Stories.actions.users.createAddress(user, {
      city: 'Cardiff',
      country: CountryCode.GB,
      postal_code: 'NE62 5DE',
      line1: 'Marquee Court',
      line2: '32'
    });

    expect(address.city).toEqual('Cardiff');
    expect(address.country).toEqual('GB');
    expect(address.postal_code).toEqual('NE62 5DE');
    expect(address.line1).toEqual('Marquee Court');
    expect(address.line2).toEqual('32');
  });

  it('Should read the users addresses', async () => {
    const addresses = await Stories.actions.users.readAddresses(user);
    
    expect(addresses).not.toBeNull();
    expect(addresses[0].city).toEqual(address.city);
    expect(addresses[0].country).toEqual(address.country);
    expect(addresses[0].postal_code).toEqual(address.postal_code);
    expect(addresses[0].line1).toEqual(address.line1);
    expect(addresses[0].line2).toEqual(address.line2);
  });

  it('Should delete the user address', async () => {
    await Stories.actions.users.deleteAddress(user, address);
    const addresses = await Stories.actions.users.readAddresses(user);
    expect(addresses).toHaveLength(0);
  });

  it('Should call user forgotPassword', async () => {
    Stories.actions.users.logout();
    await Stories.actions.users.forgotPassword(user.email_address);
  });

  it('Should reset forgotten password', async() => {
    // Get the token for the password reset
    const otp = await Stories.actions.utils.readForgottenPasswordOTP(user);
    await Stories.actions.users.resetForgottenPassword(otp, 'helloworld');

    environment.userCreationData[UserType.Client].password = 'helloworld';    
    // Expect the following action not to throw an error
    await Stories.actions.users.login(UserType.Client)
  });

  it('Should delete a user', async () => {
    await Stories.actions.common.switchActor(UserType.Client);
    await Stories.actions.users.deleteUser(user);
  });
});
