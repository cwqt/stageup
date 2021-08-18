import { NUUID } from '@core/interfaces';
import { IHostStub } from '../hosts/host.interface';
import { IPerformanceStub } from '../performances/performance.interface';
import { IUserStub } from '../users/user.interface';
import { IConsentable } from './consentable.interface';

// INTERFACES RELATING TO USERS GIVING/DENYING CONSENT
export const ConsentTypes = ['host_marketing', 'stageup_marketing', 'upload_consent'] as const;
export type ConsentType = typeof ConsentTypes[number];

// Universal personl/consent interface
export interface IUserConsent<T extends ConsentType> {
  _id: NUUID;
  type: T;
  terms_and_conditions: IConsentable<'general_toc'>;
}

// mapped types ftw
export type UserConsentData = {
  host_marketing: {
    user: IUserStub;
    host: IHostStub;
    opt_status: ConsentOpt;
    privacy_policy: IConsentable<'privacy_policy'>;
  };
  stageup_marketing: {
    user: IUserStub;
    privacy_policy: IConsentable<'privacy_policy'>;
    opt_status: SuConsentOpt;
  };
  upload_consent: {
    host: IHostStub;
    performance: IPerformanceStub;
  };
};

// soft-in: legitimate interest
// hard-out: explicit non-consent
// hard-in: explicit consent
export const ConsentOpts = ['soft-in', 'hard-in', 'hard-out'] as const;
export type ConsentOpt = typeof ConsentOpts[number];
// SU marketing consent opts are either 'hard-in' or 'hard-out'
export type SuConsentOpt = Omit<ConsentOpt, 'soft-in'>;

// utility type for below
type ConsentMixin<T extends ConsentType> = IUserConsent<T> & UserConsentData[T];

// Different types for each
export type IUserHostMarketingConsent = ConsentMixin<'host_marketing'>;
export type IUserStageUpMarketingConsent = ConsentMixin<'stageup_marketing'>;
export type IHostUploadersConsent = ConsentMixin<'upload_consent'>;

export enum OptOutOptions {
  TooFrequent = 'too_frequent',
  TooCluttered = 'too_cluttered',
  NotRelevant = 'not_relevant',
  DidntSignUp = 'didnt_sign_up'
}

// Map it to user friendly text for displaying in dropdown and in emails
export const optOutOptionsMap: { [index in OptOutOptions]: string } = {
  [OptOutOptions.TooFrequent]: `I'm getting emails too often.`,
  [OptOutOptions.TooCluttered]: `Emails are too cluttered.`,
  [OptOutOptions.NotRelevant]: `The content isn't relevant to me.`,
  [OptOutOptions.DidntSignUp]: `I never signed up, or I didn't realize that I have signed up.`
};

// When the user opts out from host marketing, an email is sent to the host with optional 'reason' and 'message' from the user as to why the are opting out.
export interface IOptOutReason {
  reason?: OptOutOptions;
  message?: string;
}
