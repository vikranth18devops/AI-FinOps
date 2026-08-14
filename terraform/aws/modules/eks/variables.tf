variable "cluster_name" { default = "finops-eks-cluster" }
variable "vpc_id" {}
variable "subnet_ids" { type = list(string) }
