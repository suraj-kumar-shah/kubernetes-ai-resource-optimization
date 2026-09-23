#!/usr/bin/env bash
set -e

echo "=================================================================="
echo "Deploying AI Workload & Monitoring to Local Kubernetes"
echo "=================================================================="

# 1. Create Namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Deploy ConfigMap & Base Deployment
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml

# 3. Deploy Prometheus Monitoring
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-configmap.yaml
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-deployment.yaml
kubectl apply -f kubernetes/monitoring/prometheus/prometheus-service.yaml

# 4. Deploy Grafana Dashboards & Service
kubectl apply -f kubernetes/monitoring/grafana/grafana-datasources.yaml
kubectl apply -f kubernetes/monitoring/grafana/grafana-dashboards-provider.yaml
# Create ConfigMap from dashboard json
kubectl create configmap grafana-dashboard-ai-workload \
  --from-file=ai-workload-dashboard.json=kubernetes/monitoring/grafana/grafana-dashboard-ai-workload.json \
  -n ai-workload --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f kubernetes/monitoring/grafana/grafana-deployment.yaml
kubectl apply -f kubernetes/monitoring/grafana/grafana-service.yaml

# 5. Wait for rollout
echo ""
echo "[Wait] Waiting for AI backend deployment rollout..."
kubectl rollout status deployment/ai-workload-backend -n ai-workload --timeout=90s

echo ""
echo "=================================================================="
echo "✓ AI Workload Cluster Services are Live!"
echo "AI Service Endpoint:  http://localhost:30080"
echo "Prometheus Dashboard: http://localhost:30090"
echo "Grafana Dashboard:    http://localhost:30000"
echo "=================================================================="
