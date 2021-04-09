import { IUser } from "./user.interface";

export interface IPasswordReset {
  otp: string;
  email_address: string;
  user__id: string;
}