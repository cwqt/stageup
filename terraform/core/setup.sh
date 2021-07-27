#!/bin/bash

SA_FILE="$PWD/terraform.service_account.json"

if [ ! -f "$SA_FILE" ]; then
  echo "Could not find service account file $SA_FILE"
  exit 1
fi

echo "Enter GCP project ID:"
read gcpid

echo "Setting up core workspaces for GCP ID: $gcpid"

terraform init

# feature core
echo "Creating core 'feat'..."
terraform workspace new feat
terraform apply -var "gcp_project_id=$gcpid" -var 'workspace=feat' -auto-approve

# staging core
echo "Creating core 'stage'..."
terraform workspace new stage
terraform apply -var "gcp_project_id=$gcpid" -var 'workspace=stage' -auto-approve

# production core
echo "Creating core 'prod'..."
terraform workspace new prod
terraform apply -var "gcp_project_id=$gcpid" -var 'workspace=prod' -auto-approve