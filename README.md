# Optimizing AI Workloads in Kubernetes-Based Environments

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.28+-326ce5.svg)](https://kubernetes.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)

An empirical, reproducible university research project investigating how CPU/memory resource allocation, limits, and Kubernetes Horizontal Pod Autoscaling (HPA) affect the throughput, response time percentiles ($p_{50}, p_{95}, p_{99}$), scaling response time ($T_{scale}$), and hardware resource efficiency ($\eta$) of containerized AI inference workloads under varying request loads.

---

## 1. System Architecture

```
User / Researcher
       │
       ▼
React + Vite Frontend (Port 5173)
       │ HTTP / JSON
       ▼
FastAPI AI Backend (Port 8000 / NodePort 30080)
       │
       ▼
Container Runtime (Docker Desktop)
       │
       ▼
Local Kubernetes Cluster (`ai-workload` Namespace)
       ├── Kubernetes Service (NodePort 30080)
       ├── AI Inference Pods (Scikit-Learn NLP Classification Pipeline)
       ├── Horizontal Pod Autoscaler (HPA v2 - 60% CPU Target)
       ├── Prometheus Monitoring (NodePort 30090)
       └── Grafana Research Dashboards (NodePort 30000)
```

---

## 2. Directory Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI application & REST endpoints
│   │   ├── model.py              # Real NLP inference engine & TF-IDF pipeline
│   │   ├── inference.py          # Execution timer & telemetry recorder
│   │   ├── metrics.py            # Prometheus custom metrics collector
│   │   └── config.py             # Environment and model settings
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Research dashboard & inference playground
│   │   ├── index.css             # Custom Vanilla CSS design system
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── kubernetes/
│   ├── namespace.yaml            # Dedicated ai-workload namespace
│   ├── deployment.yaml           # AI workload deployment specification
│   ├── service.yaml              # NodePort 30080 service
│   ├── hpa.yaml                  # Horizontal Pod Autoscaler (1-8 replicas)
│   ├── configmap.yaml            # Application runtime configuration
│   ├── resource-profiles/
│   │   ├── low.yaml              # 150m req / 250m lim CPU | 128Mi RAM
│   │   ├── medium.yaml           # 300m req / 500m lim CPU | 256Mi RAM
│   │   └── high.yaml             # 800m req / 1200m lim CPU | 512Mi RAM
│   └── monitoring/
│       ├── prometheus/           # Prometheus scrape configuration & service
│       └── grafana/              # Grafana dashboards & Prometheus datasource
│
├── load-testing/
│   ├── locustfile.py             # Locust user simulation harness
│   ├── scenarios/
│   │   ├── steady_load.conf      # Constant rate workload
│   │   ├── step_load.conf        # Staircase ramp-up workload
│   │   └── spike_load.conf       # Sudden traffic surge workload
│   └── README.md
│
├── experiments/
│   ├── configurations/
│   │   └── matrix.json           # 3x3x2 Factorial experiment configuration
│   ├── scripts/
│   │   ├── run_matrix_benchmark.py # Automated experiment runner
│   │   ├── parse_metrics.py      # Statistical aggregator (mean, std, p95)
│   │   └── generate_visualizations.py # Publication graph generator
│   ├── raw/                      # Raw JSON telemetry (EXP-YYYY-XXX.json)
│   ├── processed/                # Aggregated statistical datasets
│   └── graphs/                   # Generated publication-quality figures
│
├── research/
│   ├── methodology.md            # Mathematical models & variables
│   ├── experiment-design.md      # Factorial design & noise mitigation
│   ├── metrics.md                # Formal definitions of performance metrics
│   └── results-template.md       # Evidence-based reporting template
│
├── scripts/
│   ├── setup.sh                  # Checks prerequisites & builds Docker image
│   ├── deploy.sh                 # Launches full Kubernetes stack
│   ├── delete.sh                 # Tears down cluster namespace
│   ├── run-experiment.sh         # CLI wrapper for experiment runner
│   └── collect-results.sh        # Generates tables and charts
│
├── docker-compose.yml            # Local standalone Docker alternative
├── Makefile                      # Standard developer & researcher shortcuts
├── LICENSE                       # MIT License
└── README.md
```

---

## 3. Local Docker Desktop Kubernetes Setup

This project runs entirely on a single-node local Kubernetes cluster provided by Docker Desktop.

### Prerequisites
- **Docker Desktop** on macOS with Kubernetes enabled (`Settings` → `Kubernetes` → `Enable Kubernetes`).
- **kubectl Context**: Ensure your active context is set to Docker Desktop:
  ```bash
  kubectl config use-context docker-desktop
  ```
- **Kubernetes Metrics Server** (Required for HPA and `kubectl top`):
  In Docker Desktop, kubelet uses self-signed certificates. If not already installed, deploy Metrics Server with insecure TLS:
  ```bash
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
  ```
- **Python 3.10+** and **Node.js 18+**

---

## 4. Quick Start & Deployment

### Step 1: Environment Setup & Image Build
```bash
make setup
```
*Validates Docker, kubectl, and builds the container image `ai-workload-backend:latest`.*

### Step 2: Deploy AI Workload & Monitoring Stack
```bash
make k8s-deploy
```
*Deploys the AI backend (NodePort `30080`), Prometheus server (`30090`), and Grafana (`30000`) into the `ai-workload` namespace.*

### Step 3: Launch Frontend Dashboard
```bash
make run-frontend
```
*Starts Vite dev server at `http://localhost:5173`. Uses `VITE_API_BASE_URL=http://localhost:30080` (configured in `frontend/.env`).*

### Access Endpoints:
- **Frontend Dashboard**: `http://localhost:5173`
- **AI Service Endpoint**: `http://localhost:30080`
- **Prometheus Telemetry**: `http://localhost:30090`
- **Grafana Research Dashboard**: `http://localhost:30000` (User: `admin`, Password: `admin`)

---

## 4. Running Controlled Experiments

The experiment runner executes the $3 \times 3 \times 2$ factorial experiment matrix (Resource Profile $\times$ Workload Level $\times$ Scaling Mode) with 3 repetitions per condition:

```bash
# Run full automated factorial benchmark matrix:
make experiment

# Or execute a targeted condition:
./scripts/run-experiment.sh --profile medium --workload high --scaling hpa --repetitions 3
```

Raw experiment logs are saved monotonically to `experiments/raw/EXP-2026-XXX.json`.

---

## 5. Statistical Analysis & Visualizations

To process collected data and generate publication-quality charts:

```bash
make analyze
```

Outputs:
- Summary table with mean $\pm$ standard deviation for RPS, Average Latency, and $p_{95}$ Latency.
- Publication charts in `experiments/graphs/`:
  - `workload_vs_avg_latency.png`
  - `workload_vs_p95_latency.png`
  - `cpu_allocation_vs_latency.png`
  - `workload_vs_throughput.png`
  - `fixed_vs_hpa_comparison.png`
  - `workload_vs_pod_count.png`
  - `resource_efficiency_pareto.png`

---

## 6. Running the Interactive Frontend

```bash
make run-frontend
```
Open `http://localhost:5173` to explore live inference classifications, system health, and empirical research results.

---

## 7. Teardown
```bash
make k8s-delete
```
Removes all pods, deployments, and services from your local Kubernetes cluster.
