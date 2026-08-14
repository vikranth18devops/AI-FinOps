variable "resource_group_name" {}
variable "location" {}
variable "vnet_name" { default = "finops-azure-vnet" }
variable "address_space" { default = "10.0.0.0/16" }
variable "subnet_prefix" { default = "10.0.1.0/24" }
