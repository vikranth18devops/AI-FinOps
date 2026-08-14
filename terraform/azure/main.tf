terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80.0"
    }
  }

  # Azure Remote Backend State Storage
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "finopstfstate2026"
    container_name       = "tfstate"
    key                  = "azure.aks.tfstate"
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "AI Cloud Cost Detective"
  }
}

# Module 1: Networking (VNet & Subnet)
module "networking" {
  source              = "./modules/networking"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}

# Module 2: AKS Kubernetes Cluster
module "aks" {
  source              = "./modules/aks"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  subnet_id           = module.networking.subnet_id
}
