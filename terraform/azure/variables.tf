variable "resource_group_name" {
  type        = string
  default     = "finops-global-rg"
  description = "Azure Resource Group name"
}

variable "location" {
  type        = string
  default     = "eastus"
  description = "Azure Region location"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment"
}

variable "aks_cluster_name" {
  type        = string
  default     = "finops-aks-cluster"
  description = "AKS Cluster Name"
}

variable "aks_node_count" {
  type        = number
  default     = 2
  description = "Initial worker node count"
}

variable "aks_node_vm_size" {
  type        = string
  default     = "Standard_D2s_v5"
  description = "Azure VM Instance SKU for AKS worker nodes"
}

variable "aks_os_disk_size_gb" {
  type        = number
  default     = 128
  description = "OS Disk Size in GB for worker nodes"
}

variable "aks_enable_auto_scaling" {
  type        = bool
  default     = true
  description = "Enable auto-scaling for AKS default node pool"
}

variable "aks_min_node_count" {
  type        = number
  default     = 1
  description = "Minimum node count for auto-scaling"
}

variable "aks_max_node_count" {
  type        = number
  default     = 3
  description = "Maximum node count for auto-scaling"
}
