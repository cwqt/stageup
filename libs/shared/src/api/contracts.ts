import {
  ConsentOpt,
  IAsset,
  IDeletePerfReason,
  IHost,
  IHostInvitation,
  IHostOnboarding,
  IHostPrivate,
  IInvoice,
  ILocale,
  IMUXHookResponse,
  IPatronSubscription,
  IPatronTier,
  IPerformance,
  IRefund,
  ITicket,
  IUser,
  IUserPrivate,
  IUserStub,
  LiveStreamState
} from '@core/interfaces';
import { Asset as MuxAsset, LiveStream } from '@mux/mux-node';
import Stripe from 'stripe';
import { PasswordReset } from './entities';

// Domain Events
export type EventContract = {
  // Users --------------------------------------------------------------------
  ['user.registered']: IUserStub & { email_address: IUserPrivate['email_address'] };
  ['user.invited_to_host']: {
    host_id: IHost['_id'];
    invite_id: IHostInvitation['_id'];
    inviter_id: IUser['_id'];
    invitee_id: IUser['_id'];
  };
  ['user.invited_to_private_showing']: {
    performance_id: IPerformance['_id'];
    host_id: IHost['_id'];
    user_id: IUser['_id'];
  };
  ['user.provisioned_access_token']: {};
  ['user.password_reset_requested']: {
    user_id: IUser['_id'];
    otp: PasswordReset['otp'];
  };
  ['user.password_changed']: {
    user_id: IUser['_id'];
  };

  // ['user.unsubscribe_from_patron_tier']: {
  //   user_id: IUser['_id'];
  //   sub_id: IPatronSubscription['_id'];
  // }; // command!
  // ['user.unsubscribed_from_patron_tier']: { sub_id: IPatronSubscription['_id'] }; // stripe un-sub complete

  // Hosts --------------------------------------------------------------------
  ['host.created']: { host_id: IHost['_id'] };
  ['host.stripe_connected']: { host_id: IHost['_id'] };
  ['host.invoice_export']: {
    format: 'csv' | 'pdf';
    invoice_ids: Array<IInvoice['_id']>;
    email_address: IHostPrivate['email_address'];
  };
  ['host.deleted']: { host_id: string };
  // Refunds ------------------------------------------------------------------
  ['refund.requested']: { invoice_id: IInvoice['_id'] };
  ['refund.refunded']: { invoice_id: IInvoice['_id']; user_id: IUser['_id']; refund_id: IRefund['_id'] };
  ['refund.initiated']: { invoice_id: IInvoice['_id']; user_id: IUser['_id']; performance_deletion: boolean };
  ['refund.rejected']: {};
  ['refund.bulk']: { invoice_ids: Array<IInvoice['_id']>; performance_deletion: boolean };
  // Patronage ----------------------------------------------------------------#
  ['patronage.started']: {
    user_id: IUser['_id'];
    tier_id: IPatronTier['_id'];
  };
  ['patronage.unsubscribe_user']: { sub_id: IPatronSubscription['_id']; user_id: IUser['_id'] };
  ['patronage.user_unsubscribed']: { sub_id: IPatronSubscription['_id']; user_id: IUser['_id'] };
  ['patronage.user_subscribed']: { sub_id: IPatronSubscription['_id']; user_id: IUser['_id'] };
  ['patronage.tier_deleted']: { tier_id: string };
  ['patronage.tier_amount_changed']: { old_tier_id: string; new_tier_id: string };
  // Tickets ------------------------------------------------------------------
  ['ticket.purchased']: {
    purchaser_id: IUser['_id'];
    invoice_id: IInvoice['_id'];
    host_id: IHost['_id'];
    ticket_id: ITicket['_id'];
    marketing_consent: ConsentOpt;
  };
  // Patronage ----------------------------------------------------------------
  // Performances -------------------------------------------------------------
  ['performance.created']: IPerformance;
  ['performance.deleted']: { performance_id: IPerformance['_id']; delete_perf_reason: IDeletePerfReason };
  ['performance.deleted_notify_user']: {
    performance_id: IPerformance['_id'];
    user_id: IUser['_id'];
    invoice_id: IInvoice['_id'];
  };
  ['performance.publicity_period_changed']: { performance_id: IPerformance['_id'] };
  ['live_stream.state_changed']: { asset_id: IAsset['_id']; state: LiveStreamState };
  // Onboardings --------------------------------------------------------------
  ['onboarding.reviewed']: { onboarding_id: IHostOnboarding['_id'] };
  // Testing ------------------------------------------------------------------
  ['test.send_email']: { user_id: IUser['_id'] };

  // MUX ----------------------------------------------------------------------
  // Basically just proxying the MUX webhook events onto the event bus prefixed by "mux."
  ['mux.video.live_stream.created']: IMUXHookResponse<LiveStream>;
  ['mux.video.live_stream.idle']: IMUXHookResponse<LiveStream>;
  ['mux.video.live_stream.active']: IMUXHookResponse<LiveStream>;
  ['mux.video.live_stream.disconnected']: IMUXHookResponse<LiveStream>;
  ['mux.video.asset.live_stream_completed']: IMUXHookResponse<LiveStream>;
  ['mux.video.asset.created']: IMUXHookResponse<MuxAsset>;
  ['mux.video.asset.ready']: IMUXHookResponse<MuxAsset>;
  ['mux.video.asset.errored']: IMUXHookResponse<MuxAsset>;
  ['mux.video.asset.deleted']: IMUXHookResponse<MuxAsset>;

  // Stripe -----------------------------------------------------------------
  // Same as MUX, proxying webhook events but prefixed by "stripe."
  ['stripe.payment_intent.created']: Stripe.Event.Data;
  ['stripe.payment_intent.succeeded']: Stripe.Event.Data;
  ['stripe.charge.refunded']: Stripe.Event.Data;
  ['stripe.invoice.payment_succeeded']: Stripe.Event.Data;
  ['stripe.customer.subscription.deleted']: Stripe.Event.Data;
};

export type Event = keyof EventContract; // "user.registered" | "user.password_..."

export type ContractMeta = {
  locale?: ILocale;
  timestamp: number;
  uuid: string;
};

export type Contract<T extends Event> = EventContract[T] & {
  __meta: ContractMeta;
};

/**
 * @description Have multiple event handlers on a single event
 * @example bus.subscribe("some.event", combine([handler1, handler2]));
 */
export const combine = <T extends Event>(fns: Array<(ct: Contract<T>) => Promise<void>>) => {
  return async function (ct: Contract<T>) {
    const self = this; // keep ctx binding to Event class, e.g. combine([a,b,c]).bind(SomethingEvents)
    return Promise.allSettled(fns.map(f => f.bind(self, ct)())).then(
      v => (console.log(v), v.forEach(r => r.status == 'rejected' && console.error(ct, 'failure!', r.reason)), v)
    );
  };
};
