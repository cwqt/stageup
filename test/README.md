# Backend Integration Testing

## Requirements

- agenda and backend to work in tandem
- Use Azure auth tokens for authentication
- Be able to interact with API in a 'story'
- Be able to change to different usesrs for each user role, `EnvAdmin`, `SpaceAdmin` etc.
- Interact with a non-mock database
- Compare all created data with predefined output data/optional ignores, e.g. excluding `_id`s, `createdAt` etc. to verify data uploaded correctly

## Setting up

* set up fresh mongodb
    - In Studio3t create new database called `delivery_bridge_test` on `localhost:27017`
    - Copy all collections from current working db to this new one
    - Add new user to database called `delivery-bridger`, password: `db123`, permissions: `dbAdmin`
    - Update .env in backend & agenda to include new db: `MONGODB_TEST=mongodb://delivery_bridger:db1234@localhost:27017/delivery_bridge_test`

* run agenda/backend in test mode: `npm run start-test`
* run tests: `npm run test`

---

### Creating actions

Go to relevant folder, e.g. for creating a new space: `/lib/actions/spaces.actions.ts`

```typescript
createSpace = async (props:any):Promise<IDocumentSpace> => {
    props = props ?? {
        title: "Test space"
    }
    //if no data is to be used in a POST, set data arg to null
    let res = await Axios.post(`${environment.baseUrl}/api/space`, props, {
        headers: {
            "Authorization": 'bearer ' + Stories.getActiveUser().token,
            "Content-Type": 'application/json'
        }
    })

    expect(res.status).to.be.eq(200);
    return res.data;
}
```

### Users

Another important factor is changing roles/user depending on the action you want to take, users are cached upon creation:  
Initially the logged in user is the Environment Admin.  
See `lib/environment.ts` for a list of user enums.

```typescript
    const DM = {
        firstName: "Doc Manager",
        lastName: "WowLastName",
        email: environment.users[UserRole.DocMan].email,
        organisation: "Athensys",
        ...environment.users[UserRole.DocMan].permissions
    };

    it('should create a doc man, add them to the new space, then switch to acting as them', async () => {
        await Stories.actions.common.setUp();
        await Stories.actions.common.changeActiveUser(UserRole.EnvAdmin);
        let space = await Stories.actions.spaces.createDocumentSpace();

        await Stories.actions.users.createUser(DM);
        await Stories.actions.spaceUsers.addUser(UserRole.DocMan, space);
        await Stories.actions.common.changeActiveUser(UserRole.DocMan);
    })
```

The way the server percieves who is making the request is through the token sent in the `Authorization` header, change the token - change the user.

Actions can take advantage of this by using `Stories.getActiveUser()`, making requests in the role of a currently active user, e.g.

```typescript
    getCurrentUser: async () => {
        let res = await Axios.get(`${environment.baseUrl}/api/user`, {
            headers: {
                "Authorization": 'bearer ' + Stories.getActiveUser().token,
                "Content-Type": 'application/json'
            }
        })
        
        Stories.setUser(Stories.activeUser, res.data);
    }
```
