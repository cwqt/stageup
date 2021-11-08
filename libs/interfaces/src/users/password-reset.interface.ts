import { User } from '@core/api';

export interface IPasswordReset {
  otp: string;
  email_address: string;
  user: User;
}

export interface DtoResetPassword {
  new_password: string;
  old_password: string;
}
