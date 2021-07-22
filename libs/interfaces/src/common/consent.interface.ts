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
