resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.gcp_region

  enable_autopilot = true

  network    = var.network_name
  subnetwork = var.subnet_name
}
