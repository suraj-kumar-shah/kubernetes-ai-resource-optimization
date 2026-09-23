"""
FastAPI Main Application for AI Workload Benchmarking in Kubernetes.
"""

from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import socket
import os
import time
import psutil
import json
import glob

from app.config import settings
from app.model import model_instance
from app.inference import run_single_inference, run_batch_inference
from app.metrics import get_prometheus_metrics

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Scalable AI Workload for Kubernetes Resource Optimization & HPA Research"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models
class PredictRequest(BaseModel):
    text: str = Field(
        default="Horizontal Pod Autoscaling dynamically scales deployment replicas based on CPU threshold.",
        description="Text content for classification"
    )
    complexity_factor: Optional[int] = Field(
        default=1,
        ge=1,
        le=50,
        description="Complexity multiplier for controlled CPU stress testing"
    )


class BatchPredictRequest(BaseModel):
    texts: List[str] = Field(
        default=[
            "Kubernetes container resource limits enforce hard memory boundaries.",
            "Gradient descent optimization with Adam updates neural network weights.",
            "CRISPR Cas9 enables targeted double-stranded DNA modifications."
        ],
        description="List of text samples for batch inference"
    )
    complexity_factor: Optional[int] = Field(
        default=1,
        ge=1,
        le=50,
        description="Complexity multiplier for batch inference"
    )


class BenchmarkRequest(BaseModel):
    iterations: int = Field(default=50, ge=1, le=500, description="Number of sequential inferences for baseline benchmark")
    complexity_factor: int = Field(default=1, ge=1, le=20)


@app.on_event("startup")
async def startup_event():
    """Warms up the model on startup so that cold-start doesn't distort benchmarks."""
    print(f"[{settings.APP_NAME}] Starting up pod on host {socket.gethostname()}...")
    _ = model_instance.predict("Initial cold-start warm-up sentence.", complexity_factor=1)
    print(f"[{settings.APP_NAME}] Model warm-up complete.")


@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "pod_name": socket.gethostname(),
        "status": "online",
        "docs_url": "/docs",
        "metrics_url": "/metrics"
    }


@app.get("/healthz")
async def healthz():
    """Kubernetes Liveness Probe."""
    return {"status": "healthy", "timestamp": time.time(), "pod": socket.gethostname()}


@app.get("/readyz")
async def readyz():
    """Kubernetes Readiness Probe."""
    if model_instance.pipeline is None:
        raise HTTPException(status_code=503, detail="AI Model pipeline is not ready")
    return {"status": "ready", "model_version": settings.MODEL_VERSION, "pod": socket.gethostname()}


@app.get("/metrics")
async def metrics():
    """Prometheus Scrape Endpoint."""
    data, content_type = get_prometheus_metrics()
    return Response(content=data, media_type=content_type)


@app.post("/predict")
async def predict(req: PredictRequest):
    """Executes single AI inference with real NLP computation."""
    try:
        response = run_single_inference(text=req.text, complexity_factor=req.complexity_factor)
        response["pod_name"] = socket.gethostname()
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch_predict")
async def batch_predict(req: BatchPredictRequest):
    """Executes batch AI inference with real NLP computation."""
    if len(req.texts) > settings.MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Batch size {len(req.texts)} exceeds maximum allowed {settings.MAX_BATCH_SIZE}"
        )
    try:
        response = run_batch_inference(texts=req.texts, complexity_factor=req.complexity_factor)
        response["pod_name"] = socket.gethostname()
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/system-info")
async def system_info():
    """Detailed pod host system info for resource auditing."""
    mem = psutil.virtual_memory()
    return {
        "pod_name": socket.gethostname(),
        "cpu_count_logical": psutil.cpu_count(logical=True),
        "cpu_count_physical": psutil.cpu_count(logical=False),
        "cpu_percent": psutil.cpu_percent(interval=None),
        "memory_total_mb": round(mem.total / (1024 * 1024), 2),
        "memory_available_mb": round(mem.available / (1024 * 1024), 2),
        "memory_used_mb": round(mem.used / (1024 * 1024), 2),
        "memory_percent": mem.percent,
        "environment": settings.ENVIRONMENT,
        "model_version": settings.MODEL_VERSION
    }


@app.get("/model-info")
async def model_info():
    """Scientific documentation of the model architecture, training, and inference."""
    return {
        "metadata": model_instance.model_metadata,
        "classes": model_instance.classes,
        "num_classes": len(model_instance.classes),
        "hardware_profile": {
            "execution_engine": "Scikit-Learn + NumPy vector acceleration",
            "precision": "Float64 / Float32",
            "thread_parallelism": "OpenMP / BLAS linear algebra"
        }
    }


@app.post("/benchmark")
async def pod_benchmark(req: BenchmarkRequest):
    """Executes a local deterministic benchmark inside the pod to measure raw compute capacity."""
    sample_text = "Transformer attention mechanisms compute scaled dot-product attention over key, query, and value projection matrices."
    latencies = []
    
    start_bench = time.perf_counter()
    for _ in range(req.iterations):
        t0 = time.perf_counter()
        _ = model_instance.predict(sample_text, complexity_factor=req.complexity_factor)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)
    total_time_ms = (time.perf_counter() - start_bench) * 1000.0
    
    latencies.sort()
    n = len(latencies)
    
    p50 = latencies[int(n * 0.50)]
    p90 = latencies[int(n * 0.90)]
    p95 = latencies[int(n * 0.95)]
    p99 = latencies[int(n * 0.99)]
    avg_lat = sum(latencies) / n
    rps = (n / (total_time_ms / 1000.0)) if total_time_ms > 0 else 0
    
    return {
        "pod_name": socket.gethostname(),
        "iterations": req.iterations,
        "complexity_factor": req.complexity_factor,
        "total_duration_ms": round(total_time_ms, 2),
        "throughput_rps": round(rps, 2),
        "latency_stats_ms": {
            "mean": round(avg_lat, 3),
            "min": round(latencies[0], 3),
            "max": round(latencies[-1], 3),
            "p50": round(p50, 3),
            "p90": round(p90, 3),
            "p95": round(p95, 3),
            "p99": round(p99, 3)
        }
    }


@app.get("/experiments/data")
async def get_experiments_data():
    """
    Returns actual processed experiment results if any have been run.
    If no experiments have been executed, explicitly indicates 'Experimental data not available.'
    """
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../experiments"))
    processed_dir = os.path.join(base_dir, "processed")
    graphs_dir = os.path.join(base_dir, "graphs")
    
    if not os.path.exists(processed_dir):
        return {
            "status": "no_data",
            "message": "Experimental data not available.",
            "experiments": [],
            "graphs": []
        }
    
    json_files = glob.glob(os.path.join(processed_dir, "*.json"))
    if not json_files:
        return {
            "status": "no_data",
            "message": "Experimental data not available.",
            "experiments": [],
            "graphs": []
        }
        
    experiments = []
    for jf in json_files:
        try:
            with open(jf, "r") as f:
                data = json.load(f)
                experiments.append(data)
        except Exception:
            pass
            
    # Check graphs
    graph_files = []
    if os.path.exists(graphs_dir):
        for ext in ("*.png", "*.svg"):
            graph_files.extend([os.path.basename(p) for p in glob.glob(os.path.join(graphs_dir, ext))])
            
    return {
        "status": "success",
        "total_experiments": len(experiments),
        "experiments": experiments,
        "graphs": graph_files
    }
