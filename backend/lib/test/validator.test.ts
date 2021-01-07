import { describe, it } from 'mocha';
import { expect } from 'chai';
import { body, query, object, single, array, params } from '../common/validate';
import { ErrCode, IAddress, Idless, IOnboardingAddMembers } from '@eventi/interfaces';
import Validators from '../common/validate';

describe('Custom validation', () => {
  it('Should return correct results for simple, unnested objects', async () => {
    const data = {
      name: 'cass',
      age: 21,
      location: 'cardiff',
    };

    // Should return 2 errors for name & age
    const errors = await object(data, {
      name: v => v.isInt(),
      age: v => v.isString(),
      location: v => v.isString(),
    });

    expect(errors).to.be.lengthOf(2);

    expect(errors[0].location).to.eq(undefined);
    expect(errors[0].code).to.eq(ErrCode.INVALID);
    expect(errors[0].param).to.eq('name');
    expect(errors[0].value).to.eq(data.name);

    expect(errors[1].location).to.eq(undefined);
    expect(errors[1].code).to.eq(ErrCode.INVALID);
    expect(errors[1].param).to.eq('age');
    expect(errors[1].value).to.eq(data.age);
  });

  it('Should return correct results for nested objects', async () => {
    const data = {
      name: 'cass',
      address: {
        street_name: 'ham street',
        street_number: 12,
      },
    };

    const errors = await object(data, {
      name: v => v.equals('not cass'),
      address: v =>
        v.custom(
          single<typeof data.address>(
            {
              street_number: v => v.isString(),
              street_name: v => v.isString(),
            },
            ErrCode.TOO_LONG
          )
        ),
    });

    expect(errors).to.be.lengthOf(2);
    expect(errors[0].param).to.be.eq('name');

    expect(errors[1].param).to.be.eq('address');
    expect(errors[1].value).to.include(data.address);

    expect(errors[1].nestedErrors).to.be.an('array');
    expect(errors[1].nestedErrors).to.be.lengthOf(1);
    expect(errors[1].nestedErrors[0].param).to.eq('street_number');
  });

  it('Should return correct results for arrays of objects in an object', async () => {
    const data = {
      name: 'Cass',
      addresses: [{ street_number: '2001' }, { street_number: '2000' }, { street_number: '2002' }],
    };

    const errors = await object(data, {
      name: v => v.equals('Not Cass').withMessage(ErrCode.IN_USE),
      addresses: v =>
        v.custom(
          array({
            street_number: v => v.equals('2000'),
          })
        ),
    });

    expect(errors).to.be.lengthOf(2);
    expect(errors[0].code).to.be.eq(ErrCode.IN_USE);

    expect(errors[1].code).to.eq(ErrCode.INVALID);
    expect(errors[1].value).to.eq(undefined); //don't return array value in error return
    expect(errors[1].nestedErrors).to.be.lengthOf(2);

    // 1st address
    expect(errors[1].nestedErrors[0].idx).to.eq(0);
    expect(errors[1].nestedErrors[0].param).to.eq('street_number');
    expect(errors[1].nestedErrors[0].value).to.eq('2001');

    // 3rd address
    expect(errors[1].nestedErrors[1].idx).to.eq(2);
    expect(errors[1].nestedErrors[1].param).to.eq('street_number');
    expect(errors[1].nestedErrors[1].value).to.eq('2002');
  });

  it("Should return errors for complex nested arrays of object", async () => {
    const data = {
      fields: [
        {
          name: "Not Cass", // this should error
          address: {
            street_number: "2001"
          }
        },
        {
          name: "Cass",
          address: {
            street_number: "2000" // this should error
          }
        }
      ]
    }

    const errors = await object(data, {
      fields: v => v.custom(array({
        name: v => v.equals("Cass"),
        address: v => v.custom(single({
          street_number: v => v.equals("2001")
        }))
      }))
    });

    //TODO: validate the whole response
    expect(errors).to.be.lengthOf(1)
  });

  it("Should not return errors for valid data", async () => {
    const data:{address:Idless<IAddress>} = {
      address: {
        city: "Scunny",
        iso_country_code: "GBR",
        postcode: "CF10 5NT",
        street_name: "My Street",
        street_number: 12
      }
    }

    const errors = await object(data, {
      address: v => v.custom(single(Validators.Objects.IAddress()))
    });

    expect(errors).to.be.lengthOf(0)
  })

  it("Should not return errors for IHostMemberChangeRequest Object Validator", async () => {
    const data:IOnboardingAddMembers = {
      members_to_add: [ { user_id: 1, change: 'add' }]
    }

    const errors = await object(data, {
      members_to_add: v => v.custom(array(Validators.Objects.IHostMemberChangeRequest()))
    });

    expect(errors).to.be.lengthOf(0)
  })

  // FIXME: Arrays of primitives don't work
  // it("Should return errors for objects with fields that are arrays of primitives", async () => {
  //   const data = {
  //     data: [1,2,3,4,5]
  //   }

  //   const errors = await object(data, {
  //     data: v => v.custom(array({
  //       __this: v => v.isInt()
  //     }))
  //   })

  //   console.log(JSON.stringify(errors, null, 2));
  // })
});
