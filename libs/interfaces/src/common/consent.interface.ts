import {
    NUUID
} from '@core/interfaces';

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