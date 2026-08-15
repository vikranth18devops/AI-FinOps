variable "gcp_project_id" {
  type        = string
  default     = "my-gcp-finops-project"
  description = "GCP Project ID"
}

variable "gcp_region" {
  type        = string
  default     = "us-east1"
  description = "GCP Region (US East 1 - South Carolina)"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment"
}

variable "gke_cluster_name" {
  type        = string
  default     = "finops-gke-cluster"
  description = "GKE Cluster Name"
}

variable "gke_machine_type" {
  type        = string
  default     = "e2-medium"
  description = "Compute Engine machine type for GKE nodes (2 vCPU, 4 GB RAM)"
}

variable "gke_node_count" {
  type        = number
  default     = 2
  description = "Initial worker node count per zone"
}

variable "gke_min_node_count" {
  type        = number
  default     = 1
  description = "Minimum worker node count for autoscaling"
}

variable "gke_max_node_count" {
  type        = number
  default     = 3
  description = "Maximum worker node count for autoscaling"
}
