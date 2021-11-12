import { IUser } from "@core/interfaces";
import { Stories } from "../../stories";

describe('Test auth controller methods', () => {
  let admin: IUser & {email_address: string};

  beforeAll(async () => {
    admin = await Stories.actions.common.setup();
  });

  it('Should verify email', async () => {
    const res = await Stories.actions.auth.verifyUserEmail(admin.email_address);
  });
});
