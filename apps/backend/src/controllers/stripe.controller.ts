import { HostPermission, IStripeCheckoutSession } from "@core/interfaces";
import { Auth, BaseController, getCheck, IControllerEndpoint, Host, User, UserHostInfo } from "@core/shared/api";
import { BackendProviderMap } from "..";
import AuthStrat from '../common/authorisation';
import Env from "../env";

export default class StripeController extends BaseController<BackendProviderMap> {

  handleHook():IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => console.log(req.body)
    }
  }

  handleStripeConnectReturn():IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-handle-user-returning-to-platform
        // No state is passed through this URL. After a user is redirected to your return_url,
        // check the state of the details_submitted parameter on their account by 
        // calling the Accounts API and inspecting the returned object.

        // Still have user session, so find host that user is a Owner of;
        const uhi = await getCheck(UserHostInfo.findOne({
          relations: { host: true, user: true },
          where: {
            permissions: HostPermission.Owner,
            user: {
              _id: req.session.user._id
            }
          },
          select: {
            user: {
              _id: true
            }
          }
        }));

        // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-handle-incomplete-onboarding
        // > check for `charges_enabled` (to see if onboarding was completed)
        const res = await this.providers.stripe.connection.accounts.retrieve({
          stripeAccount: uhi.host.stripe_account_id,
          apiKey: this.providers.stripe.config.private_key
        });

        return `${Env.FE_URL}/dashboard/payments?connect-success=${res.charges_enabled}`;
        // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-accept-payment
        // After Stripe standard account connected, users can create PaymentIntents
        // where which we can take an `application_fee_amount` from the purchase
      }
    }
  }
  
  handleStripeConnectRefresh():IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        // refresh_url 
        //  Your user will be redirected to the refresh_url in these cases:
        //  * The link is expired (a few minutes went by since the link was created)
        //  * The link was already visited (the user refreshed the page or clicked back or forward in the browser)
        //  * Your platform is no longer able to access the account
        //  * The account has been rejected
        //  * Your refresh_url should trigger a method on your server to call Account Links again with the same parameters, and redirect the user to the Connect Onboarding flow to create a seamless experience.
        
        

        return `${Env.FE_URL}/dashboard/payments`;
      }
    }
  }

  createCheckoutSession():IControllerEndpoint<IStripeCheckoutSession> {
    return {
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        const session = await this.providers.stripe.connection.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "gbp",
                product_data: {
                  name: 'Stubborn Attachments',
                  images: ['https://i.imgur.com/EHyR2nP.png'],
                },
                unit_amount: 2000,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${Env.FE_URL}/payments/success`,
          cancel_url: `${Env.FE_URL}/payments/cancel`,
        });
    
        return { _id: session.id }
      }
    }
  }
}
