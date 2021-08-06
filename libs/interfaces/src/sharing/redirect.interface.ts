import { ShareLocations } from './sharing.interface';

export interface IRedirectData {
  redirect_to: string;
  social_type: ShareLocations;
  stored_redirect_choice_facebook: boolean;
  stored_redirect_choice_twitter: boolean;
  stored_redirect_choice_linkedin: boolean;
}
