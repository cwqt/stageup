import { api, environment as env } from "../environment"
import dbless from 'dbless-email-verification';
import { Stories } from "../stories";

export default {
  // router.redirect("/auth/verify-email", Auth.verifyUserEmail);
  verifyUserEmail: async (email: string) => {
    // This statements assumes when the db runs is test mode the api-tests too
    // Or if they run in different environments their PRIVATE_KEYs are still the same
    const hash = dbless.generateVerificationHash(email, process.env.PRIVATE_KEY, 60);
    await Stories.actions.utils.ignoreECONNREFUSED(api.get.bind(null, `/auth/verify-email?email_address=${email}&hash=${hash}`, env.getOptions()));
  }
}
