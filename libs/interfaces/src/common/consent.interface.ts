import { NUUID } from '@core/interfaces';
import { IHostStub } from '../hosts/host.interface';
import { IPerformanceStub } from '../performances/performance.interface';
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
}

// mapped types ftw
export type UserConsentData = {
  host_marketing: {
    user: IUserStub;
    host: IHostStub;
    soft_opt_in: boolean;
    terms_and_conditions: IConsentable<'general_toc'>;
    privacy_policy: IConsentable<'privacy_policy'>;
  };
  stageup_marketing: {
    // _>_>
    user: IUserStub;
    terms_and_conditions: IConsentable<'general_toc'>;
    privacy_policy: IConsentable<'privacy_policy'>;
    // _>_>
  };
  cookies: {
    // user: IUserStub; // Commented for now. I am still not certain on what the decision is for ip_address vs user
    cookies: IConsentable<'cookies'>;
    ip_address: string; 
  };
  upload_consent: {
    host: IHostStub;
    terms_and_conditions: IConsentable<'uploaders_toc'>;
    performance: IPerformanceStub;
  };
};

// utility type for below
type ConsentMixin<T extends UserConsentType> = IUserConsent<T> & UserConsentData[T];

// Different types for each
export type IUserHostMarketingConsent = ConsentMixin<'host_marketing'>;
export type IUserStageUpMarketingConsent = ConsentMixin<'stageup_marketing'>;
export type IUserCookiesConsent = ConsentMixin<'cookies'>;
export type IUserPerformanceUploadConsent = ConsentMixin<'upload_consent'>;
