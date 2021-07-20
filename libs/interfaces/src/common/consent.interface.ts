import { NUUID } from '@core/interfaces';
import { IHostStub } from '../hosts/host.interface';
import { IUser, IUserStub } from '../users/user.interface';

// There will need to be tables for legal documents that users have agreed to on StageUp.
//    Privacy Policy Table
//    General Terms & Conditions Table
//    Uploaders Terms & Conditions Table
//    Cookies Table

// Starting to prefer this method of creating enums of 'enum' keyword due to how easily it lends itself
// to iterating over - no need for enumToValues(enum)
export const ConsentableTypes = ['general_toc', 'uploaders_toc', 'cookies', 'privacy_policy'] as const;
export type ConsentableType = typeof ConsentableTypes[number];

export interface IConsentable<T extends ConsentableType> {
  _id: string;
  type: T;
  created_at: number;
  superseded_at: number;
  document_location: string; // url of stored asset
  version: number; // incremented on succession
}

// INTERFACES RELATING TO USERS GIVING/DENYING CONSENT
export const UserConsentTypes = ['host_marketing', 'stageup_marketing', 'cookies', 'upload_consent'] as const;
export type UserConsentType = typeof UserConsentTypes[number];

// Universal personl/consent interface
export interface IUserConsent<T extends UserConsentType> {
  _id: NUUID;
  type: T;
  user: IUserStub;
}

// mapped types ftw
export type UserConsentData = {
  host_marketing: {
    host: IHostStub;
    soft_opt_in: boolean;
    terms_and_conditions: IConsentable<'general_toc'>;
    privacy_policy: IConsentable<'privacy_policy'>;
  };
  stageup_marketing: {};
  cookies: {
    ip_address: string;
  };
  upload_consent: {
    terms_and_conditions: IConsentable<'uploaders_toc'>;
  };
};

// utility type for below
type ConsentMixin<T extends UserConsentType> = IUserConsent<T> & UserConsentData[T];

// Different types for each
export type IUserHostMarketingConsent = ConsentMixin<'host_marketing'>;
export type IUserStageUpMarketingConsent = ConsentMixin<'stageup_marketing'>;
export type IUserCookiesConsent = ConsentMixin<'cookies'>;
export type IUserPerformanceUploadConsent = ConsentMixin<'upload_consent'>;
