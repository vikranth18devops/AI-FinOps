variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS Region"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment"
}

variable "eks_cluster_name" {
  type        = string
  default     = "finops-eks-cluster"
  description = "EKS Cluster Name"
}

variable "eks_instance_type" {
  type        = string
  default     = "t3.medium"
  description = "EC2 Instance Type for EKS node group (2 vCPU, 4 GB RAM)"
}

variable "eks_node_count" {
  type        = number
  default     = 2
  description = "Desired worker node count"
}

variable "eks_min_node_count" {
  type        = number
  default     = 1
  description = "Minimum worker node count for autoscaling"
}

variable "eks_max_node_count" {
  type        = number
  default     = 3
  description = "Maximum worker node count for autoscaling"
}
