variable "cluster_name" {
  type    = string
  default = "finops-gke-cluster"
}

variable "gcp_project_id" {
  type = string
}

variable "gcp_region" {
  type    = string
  default = "us-east1"
}

variable "network_name" {
  type = string
}

variable "subnet_name" {
  type = string
}

variable "machine_type" {
  type    = string
  default = "e2-medium"
}

variable "node_count" {
  type    = number
  default = 2
}

variable "min_node_count" {
  type    = number
  default = 1
}

variable "max_node_count" {
  type    = number
  default = 3
}

variable "environment" {
  type    = string
  default = "production"
}
