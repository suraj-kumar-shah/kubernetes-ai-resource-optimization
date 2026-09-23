"""
Custom Prometheus metrics exporter for AI inference performance and Kubernetes telemetry.
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import psutil
import os
import time

# Prometheus Metrics Definitions

# 1. Total Requests Counter
INFERENCE_REQUESTS_TOTAL = Counter(
    "ai_inference_requests_total",
    "Total number of AI inference requests received",
    ["endpoint", "status", "predicted_topic"]
)

# 2. Latency Histogram (Fine-grained buckets for sub-millisecond to multi-second latency distribution)
INFERENCE_LATENCY_SECONDS = Histogram(
    "ai_inference_latency_seconds",
    "Time spent processing AI inference in seconds",
    ["endpoint"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 10.0]
)

# 3. Active Concurrent Requests Gauge
ACTIVE_REQUESTS = Gauge(
    "ai_active_requests",
    "Number of currently active inference requests"
)

# 4. Batch Size Histogram
BATCH_SIZE = Histogram(
    "ai_batch_size",
    "Distribution of inference batch sizes",
    buckets=[1, 2, 4, 8, 16, 32, 64, 128]
)

# 5. Resource Gauges (Process Level)
PROCESS_MEMORY_RSS_BYTES = Gauge(
    "ai_process_memory_rss_bytes",
    "Resident Set Size memory used by the AI process in bytes"
)

PROCESS_CPU_UTILIZATION_PERCENT = Gauge(
    "ai_process_cpu_percent",
    "CPU utilization percentage of the AI backend process"
)

PROCESS_THREADS_COUNT = Gauge(
    "ai_process_threads_count",
    "Number of active threads spawned by the AI process"
)

_process = psutil.Process(os.getpid())


def update_system_metrics():
    """Updates psutil process metrics before metrics scraping."""
    try:
        mem_info = _process.memory_info()
        PROCESS_MEMORY_RSS_BYTES.set(mem_info.rss)
        PROCESS_CPU_UTILIZATION_PERCENT.set(_process.cpu_percent(interval=None))
        PROCESS_THREADS_COUNT.set(_process.num_threads())
    except Exception:
        pass


def get_prometheus_metrics() -> tuple[bytes, str]:
    """Generates Prometheus format telemetry string."""
    update_system_metrics()
    return generate_latest(), CONTENT_TYPE_LATEST
