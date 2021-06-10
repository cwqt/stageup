import { ErrorHandler as EH } from '@core/api';
import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import { HTTP, IFormErrorField as IFEF } from '@core/interfaces';
import { Except } from 'type-fest';

export type IFormErrorField = Except<IFEF, 'code'> & { code: keyof AUTOGEN_i18n_TOKEN_MAP };

// Extends with the i18n tokens for this app
export class ErrorHandler extends EH {
  constructor(statusCode: HTTP, message: keyof AUTOGEN_i18n_TOKEN_MAP = '@@error.invalid', errors?: IFormErrorField[]) {
    super(statusCode, message, errors);
  }
}
