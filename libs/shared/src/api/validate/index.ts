import { fields } from './fields.validators';
import { objects } from './objects.validators';
import { validationMiddleware } from './validation';

export default {
  Objects: objects,
  Fields: fields,
  Middleware: validationMiddleware
};
