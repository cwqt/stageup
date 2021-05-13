import {
  IHost,
  IHostInvitation,
  IInvoice,
  ILocale,
  IPatronTier,
  IPerformance,
  ITicket,
  IUser,
  IUserPrivate,
  IUserStub,
  LiveStreamState
} from '@core/interfaces';
import { PasswordReset } from '../entities';

//ISO 639_1 _ ISO 3166_1 Alpha_2
export type SupportedLocale = 'en_GB' | 'nb_NO' | 'cy_GB';

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
  // Refunds ------------------------------------------------------------------
  ['refund.requested']: { invoice_id: IInvoice['_id'] };
  ['refund.refunded']: {};
  ['refund.rejected']: {};
  // Patronage ----------------------------------------------------------------
  ['patronage.started']: {
    user_id: IUser['_id'];
    tier_id: IPatronTier['_id'];
  };
  ['patronage.purchased']: {};
  ['patronage.ended']: {};
  // Tickets ------------------------------------------------------------------
  ['ticket.purchased']: {
    purchaser_id: IUser['_id'];
    invoice_id: IInvoice['_id'];
  };
  // Patronage ----------------------------------------------------------------
  // Performances -------------------------------------------------------------
  ['performance.created']: IPerformance;
  ['live_stream.state_changed']: { performance_id: IPerformance['_id']; state: LiveStreamState };
  // Testing ------------------------------------------------------------------
  ['test.send_email']: { user_id: IUser['_id'] };
};

export type Event = keyof EventContract;
export type ContractMeta = {
  locale?: ILocale;
  timestamp: number;
  uuid: string;
};
export type Contract<T extends Event> = EventContract[T] & {
  __meta: ContractMeta;
};
