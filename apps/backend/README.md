# Backend

StageUp Core API, Express & TypeScript.

## Setting Up

Create a `.env.development` file in the root of this directory, based off of the provided `.env.example`, this will store your secret keys - **never share these with anyone** - it has been added to the `.gitignore` so you don't need to worry about accidentally committing it.

### MUX

You will also need some API keys from MUX, so now you'll need to sign up on there: <https://dashboard.mux.com/signup?type=video>  
Once you're signed up go to <https://dashboard.mux.com/settings/access-tokens>

Click _'Generate new token'_ on the right.  
Click _'Full access'_ on MUX Video for permissions & then click _'Generate token'_.

Add the following to your `.env.development` file by copy & pasting the values:

```
MUX_ACCESS_TOKEN="Access Token ID"
MUX_SECRET_KEY="Secret Key"
LOCALTUNNEL_URL="stageup-YOUR_NAME"
```

* `LOCALTUNNEL_URL`: When testing locally you want to be able to receive webhooks from MUX, instead of port forwarding our router you can use HTTP tunneling via [localtunnel](https://localtunnel.me/) to receive them.

You'll also need to add a new webhook, go to: <https://dashboard.mux.com/settings/webhooks>

Click _'Create new webhook'_.  
For the _'URL to notify'_ add `https://stageup-YOUR_NAME.loca.lt/mux/hooks`.  
And then click _'Create webhook'_.

There should be a row with your webhook, click _'Show Signing Secret'_ & paste it into your `.env.development`, like:

```
MUX_HOOK_SIGNATURE="MY_SIGNING_SECRET"
```
