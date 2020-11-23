# api

my.corrhizal.net api documentation, v2 - previously written in python flask.

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

# influxdb

```
  measurements: air_temperature, humidity
  tags: target, creator
  fields: value, unit
```

- **target**, measurement aimed at, in form `nodetype-oid1`, e.g. `farm-5f35a2bbc0456a9c366a13bc`
- **creator**, user or device property, `metric-5f35a2bb...` or `sensor-5f35a2e...`
- **value**, recorded value, bool, string or number
- **unit**, e.g. degrees C, percent, seconds
