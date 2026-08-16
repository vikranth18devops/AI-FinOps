terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90.0, < 4.0.0"
    }
  }

  # Azure Remote Backend State Storage
  backend "azurerm" {
    resource_group_name  = "finops-global-rg"
    storage_account_name = "tfstatefinops12252"
    container_name       = "tfstate"
    key                  = "azure.aks.tfstate"
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# Module 1: Networking (VNet & Subnet)
module "networking" {
  source              = "./modules/networking"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
}

# Module 2: AKS Kubernetes Cluster
module "aks" {
  source              = "./modules/aks"
  cluster_name        = var.aks_cluster_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  subnet_id           = module.networking.subnet_id
  node_count          = var.aks_node_count
  node_vm_size        = var.aks_node_vm_size
  os_disk_size_gb     = var.aks_os_disk_size_gb
  enable_auto_scaling = var.aks_enable_auto_scaling
  min_count           = var.aks_min_node_count
  max_count           = var.aks_max_node_count
  environment         = var.environment
}
