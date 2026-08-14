variable "cluster_name" { default = "finops-aks-cluster" }
variable "resource_group_name" {}
variable "location" {}
variable "dns_prefix" { default = "finops-aks" }
variable "node_count" { default = 3 }
variable "node_vm_size" { default = "Standard_D4s_v5" }
variable "subnet_id" {}
