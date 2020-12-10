import { ICacheable } from '../app.interfaces';
import { IErrorResponse } from '@eventi/interfaces';

export const handleFormErrors = (obj:ICacheable<any>, error:IErrorResponse):ICacheable<any> => {
    // Objects pass by reference, stay pure please :)
    const o = Object.assign({}, obj);

    // Put general form error
    o.error = error.message;

    // Map to each field
    Object.entries(error.errors).forEach(([field, error]) => {
        if(o.form_errors[field]) {
            o.form_errors[field] = error.msg;
        }
    })

    return o;
}