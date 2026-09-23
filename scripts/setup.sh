#!/usr/bin/env bash
set -e

echo "=================================================================="
echo "AI Workload Kubernetes Environment Setup"
echo "=================================================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[Error] Docker is not installed or not in PATH."
    exit 1
fi
echo "✓ Docker CLI found: $(docker --version)"

# Check Kubernetes / kubectl
if ! command -v kubectl &> /dev/null; then
    echo "[Error] kubectl is not installed or not in PATH."
    exit 1
fi
echo "✓ kubectl CLI found: $(kubectl version --client -o yaml | grep gitVersion | head -1)"

# Check Docker Daemon
if ! docker info &> /dev/null; then
    echo "[Error] Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi
echo "✓ Docker daemon is active."

# Check Kubernetes Cluster Connection
if ! kubectl cluster-info &> /dev/null; then
    echo "[Warning] Cannot connect to local Kubernetes cluster."
    echo "Please ensure Kubernetes is enabled in Docker Desktop Settings -> Kubernetes -> Enable Kubernetes."
else
    echo "✓ Connected to local Kubernetes cluster."
fi

# Check Metrics Server
if kubectl get deployment metrics-server -n kube-system &> /dev/null; then
    echo "✓ Metrics Server deployment detected in kube-system."
else
    echo "[Info] Metrics Server not detected in kube-system."
    echo "       To enable HPA metrics, deploy Metrics Server with:"
    echo "       kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
    echo "       kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{\"op\":\"add\",\"path\":\"/spec/template/spec/containers/0/args/-\",\"value\":\"--kubelet-insecure-tls\"}]'"
fi

# Build AI Backend Docker image
echo ""
echo "[Docker] Building local AI Workload backend container image..."
docker build -t ai-workload-backend:latest ./backend

echo ""
echo "✓ Setup complete! You can now run './scripts/deploy.sh' to launch the cluster."
