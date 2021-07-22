terraform {
  required_version = ">= 0.15.4"

  backend "gcs" {
    bucket      = "stageup-core-tf-state"
    credentials = "terraform.service_account.json"
  }

  required_providers {
    stripe = {
      source  = "franckverrot/stripe"
      version = "1.8.0"
    }
  }
}

# for dynamically creating webhooks
provider "stripe" {
  api_token = var.stripe_api_token
}

provider "google" {
  credentials = "terraform.service_account.json"
  project     = var.gcp_project
  region      = var.gcp_region
}

# google-beta for secret key management etc.
provider "google-beta" {
  credentials = "terraform.service_account.json"
  project     = var.gcp_project
  region      = var.gcp_region
}

# create a vpc to hold everything inside of
resource "google_compute_network" "vpc" {
  name                    = "vpc-${lower(var.branch_name)}"
  routing_mode            = "GLOBAL"
  auto_create_subnetworks = true
}

# and then allocate a block of private IP addresses for VPC Peering between
# a compute engine & cloud sql (databases are created on googles own vpc so we need)
# this to allow cross-communication
resource "google_compute_global_address" "private_ip_block" {
  name          = "private-ip-block-${lower(var.branch_name)}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  ip_version    = "IPV4"
  prefix_length = 28
  network       = google_compute_network.vpc.self_link
}

# private service access aka vpc peering
# allows things to communicate through googles internal network
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_block.name]
}

# firewall allow ssh ingress
resource "google_compute_firewall" "allow_ssh" {
  name      = "allow-ssh-${lower(var.branch_name)}"
  network   = google_compute_network.vpc.name
  direction = "INGRESS"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  # ssh will only work on resources that have this tag
  target_tags = ["ssh-enabled"]
}


# random id because can't re-use names 1 week after use for sql dbs
resource "random_id" "sql_id_ext" {
  byte_length = 4
}
# create postgres cloudsql instance, by default has a db called 'postgres'
# database name pg-su-123-random_id
resource "google_sql_database_instance" "main_primary" {
  name                = "pg-${lower(var.branch_name)}-${lower(random_id.sql_id_ext.id)}"
  database_version    = "POSTGRES_11"
  region              = "europe-west1"
  deletion_protection = false
  # need the private services access up before creation
  depends_on = [google_service_networking_connection.private_vpc_connection]
  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10 # 10 gb is the smallest disk size
    ip_configuration {
      ipv4_enabled    = false # prevent from having a public ip
      private_network = google_compute_network.vpc.self_link
    }
  }
}
# create a user with a password, since the root user is deleted on instance creation
resource "google_sql_user" "db_user" {
  name     = "admin"
  instance = google_sql_database_instance.main_primary.name
  password = var.sql_password
}

# db is now unlisted from the public internet - but we still need some way to access it
# done through cloud sql proxy, we use a special vm to act as a middleman private:public net
#  - aka bastion host, much smaller attack surface than a db
#  - only allow authorised ssh users to connect to vm, and then sql
# create a service account for a vm to use on the private network
resource "google_service_account" "proxy_account" {
  account_id = "cloud-sql-proxy-${lower(var.branch_name)}"
}
resource "google_project_iam_member" "role" {
  role   = "roles/cloudsql.editor"
  member = "serviceAccount:${google_service_account.proxy_account.email}"
}
resource "google_service_account_key" "key" {
  service_account_id = google_service_account.proxy_account.name
}

# vpc is a global network that covers all gcloud datacenters, each region has its own subnet
# we're asking for the subnet in the region which the cloudsql instance exists
data "google_compute_subnetwork" "regional_subnet" {
  name   = google_compute_network.vpc.name
  region = "europe-west1"
}
# now create the proxy instance in that subnet
resource "google_compute_instance" "db_proxy" {
  name                      = "db-proxy-${lower(var.branch_name)}"
  machine_type              = "f1-micro"
  zone                      = "europe-west1-a"
  desired_status            = "RUNNING"
  allow_stopping_for_update = true
  # tell the compute engine (vm) what OS to boot from
  boot_disk {
    initialize_params {
      # Container-Optimised OS, fast booting, auto-updating - ideal bastion box
      image = "cos-cloud/cos-stable"
      size  = 10       # 10gb smallest possible
      type  = "pd-ssd" # ssd please
    }
  }
  # allows inbound ssh traffic
  tags = ["ssh-enabled"] # has the firewall rule to allow :22 ingress
  # enable OS Login service, manages SSH keys for us on the box, just upload
  # public key once, and then can access at any time thereafter
  # https://cloud.google.com/compute/docs/oslogin
  # gcloud compute os-login ssh-keys add --key-file=~/.ssh/id_rsa.pub --ttl=365d
  metadata = { enable-oslogin = "TRUE" }
  # define the bash script (with tf interpolation) that will run on startup, a la .tpl ext.
  # interpolating important bc its how we pass the service account key to the proxy
  # https://cloud.google.com/compute/docs/instances/startup-scripts/linux#passing-directly
  metadata_startup_script = templatefile("${path.module}/run_cloud_sql_proxy.tpl", {
    "db_instance_name"    = "db-proxy-${lower(var.branch_name)}",
    "service_account_key" = base64decode(google_service_account_key.key.private_key),
  })
  network_interface {
    network    = google_compute_network.vpc.name
    subnetwork = data.google_compute_subnetwork.regional_subnet.self_link
    access_config {} # make the proxy have a public IP, will be ephemeral
  }
  scheduling {
    on_host_maintenance = "MIGRATE"
  }
  service_account {
    email  = google_service_account.proxy_account.email
    scopes = ["cloud-platform"] # give maximum possible scope to simplify things
  }
}


# resource "stripe_webhook_endpoint" "stripe_webhook" {
#   url = module.backend.url

#   # take these from StripeHook
#   enabled_events = [
#     "payment_intent.created",
#     "payment_intent.succeeded",
#     "charge.refunded",
#     "invoice.payment_succeeded",
#     "customer.subscription.deleted"
#   ]
# }

# pull in the front & backend images for the application & add them to the VPC
# module "frontend" {
#   source  = "garbetjie/cloud-run/google"
#   version = "1.4.0"
#   name = "frontend-${lower(var.branch_name)}"
#   image = "eu.gcr.io/${var.gcp_project}/core-frontend:${var.branch_name}-latest"
#   location = "europe-west1"
#   allow_public_access = true
#   port = 80
#   vpc_connector_name = "private_vpc_connection"
#   max_instances = 1
#   min_instances = 1
# }


# allow the cloud run backend to connect to the db
resource "google_vpc_access_connector" "vpc_connector" {
  provider = google-beta
  name     = "${lower(var.branch_name)}-vpc-connector"
  subnet {
    name = data.google_compute_subnetwork.regional_subnet.name
  }
  machine_type  = "e2-standard-4"
  min_instances = 1
  max_instances = 1
}


resource "google_cloud_run_service" "backend" {
  name       = "backend-${lower(var.branch_name)}"
  location   = "europe-west1"
  depends_on = [google_sql_database_instance.main_primary, google_vpc_access_connector.vpc_connector]

  template {
    spec {
      containers {
        image = "eu.gcr.io/${var.gcp_project}/core-backend:${var.branch_name}-latest"
        env {
          name  = "POSTGRES_HOST"
          value = google_sql_database_instance.main_primary.private_ip_address
        }
        env {
          name  = "POSTGRES_USER"
          value = "admin"
        }
        env {
          name  = "POSTGRES_PASSWORD"
          value = var.sql_password
        }
        env {
          name  = "POSTGRES_DB"
          value = "postgres"
        }
      }
    }

    metadata {
      annotations = {
        # https://github.com/hashicorp/terraform-provider-google/issues/6294
        "run.googleapis.com/vpc-access-egress" : "all"
        "run.googleapis.com/vpc-access-connector" = "${lower(var.branch_name)}-vpc-connector"
        "autoscaling.knative.dev/maxScale"        = "1"
        "run.googleapis.com/client-name"          = "terraform"
      }
    }
  }
  autogenerate_revision_name = true
}
