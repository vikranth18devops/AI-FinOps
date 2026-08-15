terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # AWS S3 & DynamoDB Remote Backend State Storage
  backend "s3" {
    bucket         = "finops-aws-tfstate-2026"
    key            = "aws/eks/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "finops-tfstate-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Module 1: AWS VPC & Subnets
module "networking" {
  source     = "./modules/networking"
  aws_region = var.aws_region
}

# Module 2: AWS EKS Kubernetes Cluster
module "eks" {
  source         = "./modules/eks"
  cluster_name   = var.eks_cluster_name
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.subnet_ids
  instance_type  = var.eks_instance_type
  node_count     = var.eks_node_count
  min_node_count = var.eks_min_node_count
  max_node_count = var.eks_max_node_count
  environment    = var.environment
}
