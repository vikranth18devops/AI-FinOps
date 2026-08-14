variable "cluster_name" {
  type        = string
  default     = "finops-aks-cluster"
  description = "Name of the Azure Kubernetes Service (AKS) cluster"
}

variable "resource_group_name" {
  type        = string
  description = "Azure Resource Group name"
}

variable "location" {
  type        = string
  description = "Azure Region location"
}

variable "dns_prefix" {
  type        = string
  default     = "finops-aks"
  description = "DNS prefix for the AKS cluster"
}

variable "node_count" {
  type        = number
  default     = 3
  description = "Number of worker nodes in the default node pool"
}

variable "node_vm_size" {
  type        = string
  default     = "Standard_D4s_v5"
  description = "Azure VM Size / SKU for AKS worker nodes"
}

variable "os_disk_size_gb" {
  type        = number
  default     = 128
  description = "OS Disk Size in GB for each AKS worker node"
}

variable "enable_auto_scaling" {
  type        = bool
  default     = true
  description = "Enable auto-scaling for AKS default node pool"
}

variable "min_count" {
  type        = number
  default     = 2
  description = "Minimum node count for auto-scaling"
}

variable "max_count" {
  type        = number
  default     = 5
  description = "Maximum node count for auto-scaling"
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID for AKS node pool integration"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Environment name (e.g. production, qa, dev)"
}
