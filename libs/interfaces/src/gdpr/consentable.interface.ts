import { RichText } from '@core/interfaces';
// There will need to be tables for legal documents that users have agreed to on StageUp.
// These are Consentables
//    Privacy Policy Table
//    Terms & Conditions Table
//    Cookies Table
// A Consent is an agreement of consent to a Consentable

// Starting to prefer this method of creating enums of 'enum' keyword due to how easily it lends itself
// to iterating over - no need for enumToValues(enum)
export const ConsentableTypes = ['general_toc', 'cookies', 'privacy_policy'] as const;
export type ConsentableType = typeof ConsentableTypes[number];

export interface IConsentable<T extends ConsentableType> {
  _id: string;
  type: T;
  created_at: number;
  superseded_at: number;
  document_location: string; // url of stored asset
  version: number; // incremented on succession
  change_reason?: RichText;
}

export interface IDocumentRequest<T extends ConsentableType> {
  type: T;
  version: number | 'latest';
}
