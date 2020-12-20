require('dotenv').config();
import { Stories } from './stories';
export interface IEnvironment {
  baseUrl: string;
  getHeaders: Function
  getOptions: Function
}

export const environment: IEnvironment = {
  baseUrl: process.env['BASE_URL'] as string,
  getOptions: () => ({ headers: environment.getHeaders() }),
  getHeaders: () => {
    return {
      Authorization: 'bearer ' + Stories.getActiveUser()?.session,
      'Content-Type': 'application/json',
    };
  }
};

