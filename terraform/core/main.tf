# custom validation, check workspace is same as passed variable to limit possible workspace names
resource "null_resource" "workspace_and_var_the_same" {
  count = terraform.workspace == var.core ? 0 : "Workspace variable must be the same as selected workspace"
}

# everything non-ephemeral to be setup, vpcs, databases et al.
locals {
  region = "europe-west1"
}

# create a VPC per workspace that will never be destroyed
resource "google_compute_network" "vpc" {
  name         = "vpc-${terraform.workspace}"
  routing_mode = "GLOBAL"

  # global limit of 100 & would otherwise make a subnet for every region
  auto_create_subnetworks = false

  # keep this alive forever because later deploys will re-use it
  lifecycle { prevent_destroy = true }
}

# Reserve global internal address range for the peering
resource "google_compute_global_address" "private_ip_address" {
  provider      = google-beta
  name          = "private-ip-${terraform.workspace}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.self_link
  lifecycle { prevent_destroy = true }
}

# Establish VPC network peering connection using the reserved address range
resource "google_service_networking_connection" "private_vpc_connection" {
  provider                = google-beta
  network                 = google_compute_network.vpc.self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
  lifecycle { prevent_destroy = true }
}

# Create postgres cloudsql instance, by default has a db called 'postgres'
# database name postgres-prod, postgres-feat etc.
resource "google_sql_database_instance" "postgres" {
  name             = "postgres-${terraform.workspace}"
  database_version = "POSTGRES_11"
  region           = local.region
  depends_on       = [google_service_networking_connection.private_vpc_connection]

  # databases must never be deleted
  deletion_protection = true
  lifecycle { prevent_destroy = true }

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10 # 10 gb is the smallest disk size
    ip_configuration {
      ipv4_enabled    = false # prevent from having a public ip
      require_ssl     = false
      private_network = google_compute_network.vpc.self_link
    }
  }
}
