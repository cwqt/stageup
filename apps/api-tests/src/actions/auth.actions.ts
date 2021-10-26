import { api, environment as env } from "../environment"
import dbless from 'dbless-email-verification';

export default {
  // router.redirect("/auth/verify-email", Auth.verifyUserEmail);
  verifyUserEmail: async (email: string) => {
    // This statements assumes when the db runs is test mode the api-tests too
    // Or if they run in different environments their PRIVATE_KEYs are still the same
    const hash = dbless.generateVerificationHash(email, process.env.PRIVATE_KEY, 60);
    try {
      await api.get(`auth/verify-email?email_address=${email}&hash=`, env.getOptions());
    } catch(error) {
      // Expect a redirect error as the front-end is not running during tests
      // If the error is different, throw the error
      if (!error.message.includes('connect ECONNREFUSED')) {
        throw(error);
      }      
    }
  }
}
