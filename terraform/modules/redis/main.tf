resource "google_compute_firewall" "firewall-ingress" {
  name    = "redis-firewall-${lower(var.name)}-ingress"
  network = var.network

  allow {
    protocol = "tcp"
    ports    = ["6379", "22", "80", "8080", "443"]
  }

  direction = "INGRESS"

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["redis-ingress"]
}
resource "google_compute_firewall" "firewall-egress" {
  name    = "redis-firewall-${lower(var.name)}-egress"
  network = var.network

  allow {
    protocol = "tcp"
    ports    = ["80", "8080", "443"]
  }

  direction   = "EGRESS"
  target_tags = ["redis-egress"]
}


resource "google_compute_router" "router" {
  name    = "${var.name}-router"
  region  = var.region
  network = var.network

  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.name}-nat"
  router                             = google_compute_router.router.name
  region                             = google_compute_router.router.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# now create the proxy instance in that subnet
resource "google_compute_instance" "default" {
  name         = "db-redis-${lower(var.name)}"
  machine_type = "f1-micro"
  # https://cloud.google.com/compute/docs/regions-zones
  zone                      = "${var.region}-b"
  desired_status            = "RUNNING"
  allow_stopping_for_update = true

  # tell the compute engine (vm) what OS to boot from
  boot_disk {
    initialize_params {
      # Container-Optimised OS, fast booting, auto-updating
      image = "cos-cloud/cos-stable"
      size  = 10       # 10gb smallest possible
      type  = "pd-ssd" # ssd please
    }
  }

  # allow https traffic to fetch redis:6 image in startup script
  tags = ["redis-egress", "redis-ingress"]

  # define the bash script (with tf interpolation) that will run on startup, a la .tpl ext.
  # interpolating important bc its how we pass the service account key to the proxy
  # https://cloud.google.com/compute/docs/instances/startup-scripts/linux#passing-directly
  metadata_startup_script = templatefile("${path.module}/run_redis.tpl", {})
  network_interface {
    network    = var.network
    subnetwork = var.subnet
  }
  scheduling {
    on_host_maintenance = "MIGRATE"
  }
}
