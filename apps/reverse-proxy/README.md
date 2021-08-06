# reverse-proxy

Used for hosting Wordpress & Jekyll blog on `stageup.uk/business` & `stageup.uk/blog` respectively using NGINX as a reverse proxy on Cloud Run.

Must have the `terraform.service_account.json` in this directory.

## Deployment

Run all commands from this directory.

```shell
# build the docker image
docker build -t eu.gcr.io/core-314910/su-reverse-proxy:latest .

# push to gcp container registry
docker push eu.gcr.io/core-314910/su-reverse-proxy:latest

# now deploy the app on Cloud Run using the terraform script in main.tf
terraform init
terraform workspace select reverse-proxy
terraform apply
```
