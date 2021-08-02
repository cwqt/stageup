export interface IPasswordReset {
  otp: string;
  email_address: string;
  user__id: string;
}

export interface DtoResetPassword {
  new_password: string;
  old_password: string;
}
