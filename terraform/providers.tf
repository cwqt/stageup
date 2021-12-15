terraform {
  required_version = ">= 0.14"
  experiments      = [module_variable_optional_attrs]

  backend "gcs" {
    bucket      = "stageup-core-tf-state"
    credentials = "terraform.service_account.json"
  }

  required_providers {
    stripe = {
      source  = "franckverrot/stripe"
      version = "1.8.0"
    }
    hashicorp = {
      source  = "hashicorp/random"
      version = "3.1.0"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "1.13.0"
    }
  }
}

# for dynamically creating webhooks
provider "stripe" {
  api_token = var.stripe_api_token
}

provider "google" {
  credentials = "terraform.service_account.json"
  project     = var.gcp_project_id
  region      = "europe-west1"
}

# google-beta for secret key management etc.
provider "google-beta" {
  credentials = "terraform.service_account.json"
  project     = var.gcp_project_id
  region      = "europe-west1"
}
