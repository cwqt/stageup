locals {
  gcp_project_id = "core-314910"
  name           = "su-rproxy"
}

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
  project     = local.gcp_project_id
  region      = "europe-west1"
}

provider "google-beta" {
  credentials = "terraform.service_account.json"
  project     = local.gcp_project_id
  region      = "europe-west1"
}


module "nginx" {
  project             = local.gcp_project_id
  source              = "garbetjie/cloud-run/google"
  version             = "1.4.0"
  name                = "su-reverse-proxy"
  image               = "eu.gcr.io/${local.gcp_project_id}/su-reverse-proxy:latest"
  location            = "europe-west1"
  allow_public_access = true
  port                = 80
  max_instances       = 1
  min_instances       = 1
  map_domains         = ["stageup.uk"]
}

resource "google_dns_record_set" "resource-recordset" {
  for_each = module.nginx.dns

  provider     = "google-beta"
  managed_zone = "stageup"
  name         = "${each.key}."
  type         = each.value[0].type
  rrdatas      = each.value[0].rrdatas
  ttl          = 3600
}

output "nginx_url" {
  value = module.nginx.url
}
