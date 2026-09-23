#!/usr/bin/env bash
set -e

echo "Tearing down ai-workload Kubernetes namespace and services..."
kubectl delete namespace ai-workload --ignore-not-found=true
echo "✓ Namespace ai-workload deleted."
