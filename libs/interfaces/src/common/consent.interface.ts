import {
    NUUID
} from '@core/interfaces';

// There will need to be tables for legal documents that users have agreed to on StageUp.

// Privacy Policy Table
//  privacy_policy_id
//  document
//  date_added
//  date_superseded

// General Terms & Conditions Table
//  general_terms_and_conditions_id
//  document
//  date_added
//  date_superseded

// Uploaders Terms & Conditions Table
//  uploaders_terms_and_conditions_id
//  document
//  date_added
//  date_superseded

// Cookies Table
//  cookies_id
//  cookies_document
//  date_added
//  date_superseded

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
export const PersonConsentTypes = ['host_marketing', 'su_marketing', 'cookies', 'upload_consent'] as const;
export type PersonConsentType = typeof PersonConsentTypes[number];

// Universal personl/consent interface
export interface IPersonConsent<T extends PersonConsentType> {
    _id: NUUID;
    type: T;
    consent_given: boolean;
    user__id?: NUUID;
    host__id?: NUUID;
    performance__id?: NUUID;
    ip_address?: string;
    terms_and_conditions__id?: NUUID;
    privacy_policy__id?: NUUID;
    cookies__id?: NUUID;
    uploaders_terms_and_conditions__id?: NUUID;
}

// Specific types for the 4 different types of consent
export type HostMarketingConsent = Pick<IPersonConsent<'host_marketing'>, "_id" | "consent_given" | "host__id" | "user__id" | "terms_and_conditions__id" | "privacy_policy__id">;
export type SuMarketingConsent = Pick<IPersonConsent<'su_marketing'>,  "_id" | "consent_given" | "user__id" | "terms_and_conditions__id" | "privacy_policy__id">;
export type UserCookieConsent = Pick<IPersonConsent<'cookies'>, "_id" | "consent_given" | "ip_address" | "cookies__id">;
export type PerformanceUploadConsent = Pick<IPersonConsent<'upload_consent'>, "_id" | "consent_given" | "performance__id" | "uploaders_terms_and_conditions__id">;