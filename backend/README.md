# AI Workload Backend Service

FastAPI-based, containerized AI inference engine designed for Kubernetes CPU/Memory allocation and Horizontal Pod Autoscaling (HPA) research experiments.

## Architecture
- **Framework**: FastAPI + Uvicorn
- **AI/ML Engine**: Scikit-Learn Sublinear TF-IDF Vectorizer + Multinomial Logistic Regression Classifier
- **Telemetry**: Custom Prometheus Exporter (`prometheus_client`)
- **Resource Monitoring**: `psutil` Process RSS/CPU tracking

## Endpoints
- `POST /predict`: Real-time single text classification with latency timing.
- `POST /batch_predict`: Multi-sample batched inference.
- `GET /healthz`: Kubernetes liveness probe.
- `GET /readyz`: Kubernetes readiness probe.
- `GET /metrics`: Prometheus metric exposition.
- `GET /system-info`: Pod hardware and runtime details.
- `GET /model-info`: Dataset, preprocessing, and model architecture documentation.
- `POST /benchmark`: In-pod CPU baseline benchmark.
- `GET /experiments/data`: Aggregated real experiment results and generated graphs.

## Local Execution
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
