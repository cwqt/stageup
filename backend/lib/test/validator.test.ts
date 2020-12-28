import { describe, it } from 'mocha';
import { expect } from 'chai';
import { body, query, object, single, array, params } from '../common/validate';
import Errors from '../common/errors';

console.log("jello")

describe('Custom validation', () => {
    // it('Should return correct results for simple, unnested objects', async () => {
    //   const data = {
    //     name: "cass",
    //     age: 21,
    //     location: "cardiff"
    //   }

    //   // Should return 2 errors for name & age
    //   const errors = await object(data, {
    //     name: v => v.isInt(),
    //     age: v => v.isString().withMessage("Must provide an age"),
    //     location: v => v.isString()
    //   });

    //   expect(errors).to.be.lengthOf(2);

    //   expect(errors[0].location).to.eq(undefined);
    //   expect(errors[0].msg).to.eq("Invalid value");
    //   expect(errors[0].param).to.eq("name");
    //   expect(errors[0].value).to.eq(data.name);

    //   expect(errors[1].location).to.eq(undefined);
    //   expect(errors[1].msg).to.eq("Must provide an age");
    //   expect(errors[1].param).to.eq("age");
    //   expect(errors[1].value).to.eq(data.age);
    // });

    // it("Should return correct results for nested objects", async () => {
    //   const data = {
    //     name:"cass",
    //     address: {
    //       street_name: "ham street",
    //       street_number: 12
    //     }
    //   }

    //   const errors = await object(data, {
    //     name: v => v.equals("not cass"),
    //     address: v => v.custom(single<typeof data.address>({
    //       street_number: v => v.isString(),
    //       street_name: v => v.isString() 
    //     }))
    //   });

    //   expect(errors).to.be.lengthOf(2);
    //   expect(errors[0].param).to.be.eq("name");

    //   expect(errors[1].param).to.be.eq("address");
    //   expect(errors[1].msg).to.be.an("array");
    //   expect(errors[1].msg).to.be.lengthOf(1);
    //   expect(errors[1].msg[0]);
    // })

    it("Should return correct results for arrays of objects in an object", async () => {
      const data = {
        name: "Cass",
        addresses: [
          { street_number: "2001" },
          { street_number: "2000" },
          { street_number: "2002" },
        ]
      }

      const errors = await object(data, {
        name: v => v.isString().equals("Not Cass"),
        addresses: v => v.custom(array({
          street_number: v => v.equals("2000")
        }))
      })

      console.log(JSON.stringify(errors, null, 2))

      expect(errors).to.be.lengthOf(2);
      expect(errors[0].msg).to.be.eq(Errors.INCORRECT);

      // console.log("\n\n\n\n\n")


      // console.log(errors);
      // console.log(errors[0].msg);

      // const data = [
      //   { name: "cass" },
      //   { name: "not cass" },
      // ]

      // const errors = await object(data, {
      //   __this: v => v.custom(array({
      //     name: v => v.equals("cass")
      //   }))
      // })

      // const errors = await Promise.all(data.map(i => object(i, {
      //   name: v => v.equals("cass")
      // })))

    
    })
})
