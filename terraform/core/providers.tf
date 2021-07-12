terraform {
  required_version = ">= 0.14"
  experiments      = [module_variable_optional_attrs]

  backend "gcs" {
    bucket      = "stageup-core-tf-state"
    credentials = "terraform.service_account.json"
  }
}

provider "google" {
  credentials = "terraform.service_account.json"
  project     = var.gcp_project_id
  region      = "europe-west1"
}

provider "google-beta" {
  credentials = "terraform.service_account.json"
  project     = var.gcp_project_id
  region      = "europe-west1"
}
