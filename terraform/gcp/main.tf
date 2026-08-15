terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # GCP GCS Bucket Remote Backend State Storage
  backend "gcs" {
    bucket = "finops-gcp-tfstate-2026"
    prefix = "gcp/gke"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Module 1: GCP VPC & Subnet
module "networking" {
  source         = "./modules/networking"
  gcp_project_id = var.gcp_project_id
  gcp_region     = var.gcp_region
}

# Module 2: GCP GKE Kubernetes Cluster
module "gke" {
  source         = "./modules/gke"
  cluster_name   = var.gke_cluster_name
  gcp_project_id = var.gcp_project_id
  gcp_region     = var.gcp_region
  network_name   = module.networking.network_name
  subnet_name    = module.networking.subnet_name
  machine_type   = var.gke_machine_type
  node_count     = var.gke_node_count
  min_node_count = var.gke_min_node_count
  max_node_count = var.gke_max_node_count
  environment    = var.environment
}
