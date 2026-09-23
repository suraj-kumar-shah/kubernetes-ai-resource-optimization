"""
Inference engine handling request lifecycle, precision latency measurements, and metric logging.
"""

import time
import os
import psutil
from typing import Dict, Any, List
from app.model import model_instance
from app.metrics import (
    INFERENCE_REQUESTS_TOTAL,
    INFERENCE_LATENCY_SECONDS,
    ACTIVE_REQUESTS,
    BATCH_SIZE
)

_process = psutil.Process(os.getpid())


def run_single_inference(text: str, complexity_factor: int = 1) -> Dict[str, Any]:
    """
    Executes single text inference with sub-millisecond precision timing and telemetry.
    """
    ACTIVE_REQUESTS.inc()
    start_time = time.perf_counter()
    start_cpu_time = time.process_time()
    
    status = "success"
    predicted_topic = "unknown"
    
    try:
        result = model_instance.predict(text=text, complexity_factor=complexity_factor)
        predicted_topic = result["predicted_topic"]
        
        end_time = time.perf_counter()
        end_cpu_time = time.process_time()
        
        wall_latency_ms = (end_time - start_time) * 1000.0
        cpu_time_ms = (end_cpu_time - start_cpu_time) * 1000.0
        latency_sec = end_time - start_time
        
        # Record to Prometheus
        INFERENCE_LATENCY_SECONDS.labels(endpoint="predict").observe(latency_sec)
        INFERENCE_REQUESTS_TOTAL.labels(endpoint="predict", status=status, predicted_topic=predicted_topic).inc()
        BATCH_SIZE.observe(1)
        
        # Memory info
        mem_rss_mb = _process.memory_info().rss / (1024 * 1024)
        
        return {
            "prediction": result,
            "metrics": {
                "wall_latency_ms": round(wall_latency_ms, 3),
                "cpu_time_ms": round(cpu_time_ms, 3),
                "process_memory_rss_mb": round(mem_rss_mb, 2),
                "timestamp": time.time()
            }
        }
    except Exception as e:
        status = "error"
        INFERENCE_REQUESTS_TOTAL.labels(endpoint="predict", status=status, predicted_topic="error").inc()
        raise e
    finally:
        ACTIVE_REQUESTS.dec()


def run_batch_inference(texts: List[str], complexity_factor: int = 1) -> Dict[str, Any]:
    """
    Executes batch inference with precision timing.
    """
    batch_len = len(texts)
    ACTIVE_REQUESTS.inc()
    start_time = time.perf_counter()
    start_cpu_time = time.process_time()
    
    status = "success"
    
    try:
        results = model_instance.predict_batch(texts=texts, complexity_factor=complexity_factor)
        
        end_time = time.perf_counter()
        end_cpu_time = time.process_time()
        
        wall_latency_ms = (end_time - start_time) * 1000.0
        cpu_time_ms = (end_cpu_time - start_cpu_time) * 1000.0
        latency_sec = end_time - start_time
        
        INFERENCE_LATENCY_SECONDS.labels(endpoint="batch_predict").observe(latency_sec)
        INFERENCE_REQUESTS_TOTAL.labels(endpoint="batch_predict", status=status, predicted_topic="batch").inc(batch_len)
        BATCH_SIZE.observe(batch_len)
        
        mem_rss_mb = _process.memory_info().rss / (1024 * 1024)
        
        return {
            "batch_size": batch_len,
            "results": results,
            "metrics": {
                "total_wall_latency_ms": round(wall_latency_ms, 3),
                "per_item_latency_ms": round(wall_latency_ms / max(batch_len, 1), 3),
                "cpu_time_ms": round(cpu_time_ms, 3),
                "process_memory_rss_mb": round(mem_rss_mb, 2),
                "timestamp": time.time()
            }
        }
    except Exception as e:
        status = "error"
        INFERENCE_REQUESTS_TOTAL.labels(endpoint="batch_predict", status=status, predicted_topic="error").inc()
        raise e
    finally:
        ACTIVE_REQUESTS.dec()
