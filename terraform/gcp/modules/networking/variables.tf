variable "gcp_project_id" {}
variable "gcp_region" { default = "us-central1" }
variable "network_name" { default = "finops-gcp-vpc" }
variable "subnet_name" { default = "finops-gcp-subnet" }
variable "ip_cidr_range" { default = "10.10.0.0/16" }
