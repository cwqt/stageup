# backend

- **body**: meaning a json body
- **params**: url fields, `/api/:MY_PARAM/something`
- **query**: `/api/something?MY_KEY=VALUE`
- **form-data**: for sending images; `enctype="multipart/form-data"`

See `/lib/routes.ts` for list of endpoints, access requirements & return types.

## errors

upon error, return will match the following interface, `IError`:

```json
{
    "status": fail | error,
    "statusCode": http_status_code,
    "message": [
        {
            "msg": error_message_for_param,
            "param": form_field, e.g. 'username',
            "location": body | params
        }
    ],
    "stack": stack_trace
}
```

or instead of an array for `message`, a string.