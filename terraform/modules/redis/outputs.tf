output "ip_address" {
  value = google_compute_instance.default.network_interface[0].network_ip
}
