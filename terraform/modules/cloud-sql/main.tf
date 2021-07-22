# create postgres cloudsql instance, by default has a db called 'postgres'
# database name pg-su-123-random_id
resource "google_sql_database_instance" "main_primary" {
  name                = "pg-${lower(var.environment)}"
  database_version    = "POSTGRES_11"
  region              = "europe-west1"
  deletion_protection = false
  depends_on          = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10 # 10 gb is the smallest disk size
    ip_configuration {
      ipv4_enabled    = false # prevent from having a public ip
      private_network = google_compute_network.vpc.self_link
      require_ssl     = false
    }
  }
}

# create a user with a password, since the root user is deleted on instance creation
resource "google_sql_user" "db_user" {
  name     = "admin"
  instance = google_sql_database_instance.main_primary.name
  password = var.sql_password
}
