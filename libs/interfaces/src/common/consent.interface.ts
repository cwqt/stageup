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
// Universal personl/consent interface
export interface IPersonConsent {
    _id: NUUID;
    type: string;
    consent_given: boolean;
    user__id?: NUUID;
    host__id?: NUUID;
    performance__id?: NUUID;
    ip_address?: string;
    terms_and_conditions_id?: NUUID;
    privacy_policy_id?: NUUID;
    cookies_id?: NUUID;
    uploaders_terms_and_conditions_id?: NUUID;
}

// Specific types for the 4 different types of consent
export type HostMarketingConsent = Pick<IPersonConsent, "_id" | "consent_given" | "host__id" | "user__id" | "terms_and_conditions_id" | "privacy_policy_id">;
export type SuMarketingConsent = Omit<HostMarketingConsent, "host__id">;
export type UserCookieConsent = Pick<IPersonConsent, "_id" | "consent_given" | "ip_address" | "cookies_id">;
export type PerformanceUploadConsent = Pick<IPersonConsent, "_id" | "consent_given" | "performance__id" | "uploaders_terms_and_conditions_id">;