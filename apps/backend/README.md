# **Backend**

StageUp Core API is written in TypeScript & Express.

This guide will take you through setting up your .env file, including setting up Localtunnel, MUX, and GCP.

## **Setting Up**

Create a `.env.development` file in the project's root directory, *'/core'*, based off of the provided `.env.example`, this will store your secret keys - **never share these with anyone** - it has been added to the `.gitignore` so you don't need to worry about accidentally committing it.

### Localtunnel

In .env.development, find and replace the lines below, replacing "YOUR_NAME" with your name:

```
HTTP_TUNNEL_URL="stageup-YOUR_NAME.loca.lt"
LOCALTUNNEL_URL="stageup-YOUR_NAME.loca.lt"
```

### **MUX**

MUX is an API that enables developers to build video streaming experiences. To use MUX, you'll need to add some API & environment keys from MUX to your .env.

First, ask the SysAdmin to create a MUX account for you. you'll receive a confirmation email where you can finish registering.

Once you're signed up, ask Sysadmin to send you an access token and secret key. Then, add the credentials to your `.env.development` file by copy & pasting the values:

```
MUX_ACCESS_TOKEN="Access Token ID"  #is shorter
MUX_SECRET_KEY="Secret Key" #is longer
```

Next, go to [https://dashboard.mux.com/organizations/5g18fv/environments](https://dashboard.mux.com/organizations/5g18fv/environments). Look for the row with the environment that you just created and who's keys you added above. Under the 'Mux Data' colum, find and copy the "Env Key'. Paste this value into your .env:

```
MUX_DATA_ENV_KEY="Env Key"
```

Last, you'll need to create a new webhook. Ask the SysAdmin to do this for you and to send you your signing secret. Add this your your .env file:

```
MUX_WEBHOOK_SIGNATURE="MY_SIGNING_SECRET"
```

### Stripe

Stripe is a payment processing software service. To use Stripe, you'll have to add some credentials to your .env.

First, ask the SysAdmin to create you a Stripe account. Once it's been created, you'll receive a Stripe confirmation email where you can finish registering yourself.

Once you're signed up, toggle on *'View test data'* in the left side nav.

Then, go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys). From here, copy the *'Publishable key'* & *'Secret key'* to your .env:

```
STRIPE_PRIVATE_KEY="pk_test_{CODE}" #sk_test
STRIPE_PUBLIC_KEY="sk_test_{CODE}" #pk_test
```

Then, go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks). Then, under *'Endpoints receiving events from Connect application'*, click *'Add endpoint'.* Within *'Endpoint URL'*, write "https://stageup-{YOUR_NAME}.loca.lt/stripe/hooks", then under *'Events to send'* click *'receive all events'*, then click *'Add enpoint'*.

Copy the 'Signing secret' from your webhook and add it to your .env:

```
STRIPE_WEBHOOK_SIGNATURE="{KEY}" #whsec
```

Finally, go to [https://dashboard.stripe.com/settings/connect](https://dashboard.stripe.com/settings/connect). Go to the *'Integration'* section, toggle on *'View test data'*, copy your *'Test mode client ID',* and add this to your .env:

```
STRIPE_CLIENT_ID="acct_{ID}" #ac
```

### Google Cloud Platform (GCP)

Most of StageUp's cloud infrastructure is set up on GCP.

Ask the SysAdmin to create you a GCP account. Then log in to GCP and from the dashboard copy the *'Project ID'* into your .env: 

```
GCP_PROJECT_ID="" #core-314910
```

Next, you need to configure your GCP credentials in your .env. Ask the SysAdmin to create a service account for you and to send you the *'service_account.json'* credentials file. If the JSON file you're sent is named differently, just rename it to *'service_account.json'*.

Add this file into the root directory of this backend app (apps/backend). It's already added been added to the .gitignore, so you don't need to worry about accidentally pushing it. Finally, add the path to this file in your .env:

```
GOOGLE_APPLICATION_CREDENTIALS="./service_account.json"
```

### Sendgrid

We use Sendgrid to send emails. You'll need your own account, so to go to Sendgrid and complete the registration process. 

Once you're logged in, go to [https://app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys) and create an API key called "Development Key". Give your key "Full API Permissions" and click 'Create & View'. Copy the api key code and add it to your .env: 

```
SENDGRID_API_KEY="" # SG.xx
```

You'll also need to authenticate an email address to use, ask the SysAdmin to do this for you. Once it's been done, you'll receive an email to authenticate your email address. Then add the email to the .env:

```
EMAIL_ADDRESS=""
```