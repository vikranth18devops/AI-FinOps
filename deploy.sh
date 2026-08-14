#!/usr/bin/env bash
set -e

chmod +x deploy-azure.sh deploy-aws.sh deploy-gcp.sh

echo "================================================================="
echo " 🛡️ AI CLOUD COST DETECTIVE - ONE-CLICK MULTI-CLOUD DEPLOYMENT"
echo "================================================================="
echo "Select Target Kubernetes Cloud Provider:"
echo " 1) Azure AKS (Azure Kubernetes Service)"
echo " 2) AWS EKS (Elastic Kubernetes Service)"
echo " 3) GCP GKE (Google Kubernetes Engine)"
echo "================================================================="

read -p "Enter choice [1-3]: " CHOICE

case $CHOICE in
  1)
    echo "Starting 1-Click Deployment on Azure AKS..."
    ./deploy-azure.sh
    ;;
  2)
    echo "Starting 1-Click Deployment on AWS EKS..."
    ./deploy-aws.sh
    ;;
  3)
    echo "Starting 1-Click Deployment on GCP GKE..."
    ./deploy-gcp.sh
    ;;
  *)
    echo "Invalid option. Exiting."
    exit 1
    ;;
esac
