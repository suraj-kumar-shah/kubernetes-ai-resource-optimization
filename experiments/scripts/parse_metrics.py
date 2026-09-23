#!/usr/bin/env python3
"""
Scientific Metric Parser and Statistical Aggregator for AI Workload Kubernetes Experiments.
Processes raw experiment telemetry and computes mean, standard deviation, percentiles, and efficiency indices.
"""

import os
import glob
import json
import numpy as np
import pandas as pd
from tabulate import tabulate

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RAW_DIR = os.path.join(BASE_DIR, "experiments/raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "experiments/processed")

os.makedirs(PROCESSED_DIR, exist_ok=True)


def parse_cpu_cores(cpu_str: str) -> float:
    """Parses k8s cpu string (e.g. 500m -> 0.5, 2 -> 2.0)."""
    if cpu_str.endswith("m"):
        return float(cpu_str.replace("m", "")) / 1000.0
    return float(cpu_str)


def parse_memory_mb(mem_str: str) -> float:
    """Parses k8s memory string (e.g. 512Mi -> 512.0, 1Gi -> 1024.0)."""
    if mem_str.endswith("Gi"):
        return float(mem_str.replace("Gi", "")) * 1024.0
    if mem_str.endswith("Mi"):
        return float(mem_str.replace("Mi", ""))
    return float(mem_str)


def compute_statistics(values: list) -> dict:
    """Computes full statistical distribution metrics across repeated experimental trials."""
    if not values:
        return {
            "mean": 0.0, "median": 0.0, "std_dev": 0.0,
            "min": 0.0, "max": 0.0, "p50": 0.0, "p90": 0.0, "p95": 0.0, "p99": 0.0
        }
    arr = np.array(values)
    return {
        "mean": round(float(np.mean(arr)), 3),
        "median": round(float(np.median(arr)), 3),
        "std_dev": round(float(np.std(arr)), 3),
        "min": round(float(np.min(arr)), 3),
        "max": round(float(np.max(arr)), 3),
        "p50": round(float(np.percentile(arr, 50)), 3),
        "p90": round(float(np.percentile(arr, 90)), 3),
        "p95": round(float(np.percentile(arr, 95)), 3),
        "p99": round(float(np.percentile(arr, 99)), 3)
    }


def process_raw_experiment(raw_path: str) -> dict:
    """Processes a single raw experiment file containing multiple trials."""
    with open(raw_path, "r") as f:
        data = json.load(f)
        
    exp_id = data.get("experiment_id", os.path.basename(raw_path).replace(".json", ""))
    cfg = data.get("configuration", {})
    trials = data.get("trials", [])
    
    if not trials:
        return None
        
    # Extract series across repetitions
    rps_list = []
    avg_latencies = []
    p50_latencies = []
    p90_latencies = []
    p95_latencies = []
    p99_latencies = []
    failure_counts = []
    total_requests = []
    max_pods = []
    
    for t in trials:
        loc = t.get("locust_results", {})
        rps_list.append(loc.get("current_rps", 0.0))
        avg_latencies.append(loc.get("average_response_time", 0.0))
        p50_latencies.append(loc.get("p50_ms", 0.0))
        p90_latencies.append(loc.get("p90_ms", 0.0))
        p95_latencies.append(loc.get("p95_ms", 0.0))
        p99_latencies.append(loc.get("p99_ms", 0.0))
        failure_counts.append(loc.get("failure_count", 0))
        total_requests.append(loc.get("request_count", 0))
        max_pods.append(t.get("max_pods_observed", 1))
        
    cpu_limit_cores = parse_cpu_cores(cfg.get("resource_details", {}).get("cpu_limit", "500m"))
    mem_limit_mb = parse_memory_mb(cfg.get("resource_details", {}).get("memory_limit", "512Mi"))
    
    rps_stats = compute_statistics(rps_list)
    avg_lat_stats = compute_statistics(avg_latencies)
    p95_lat_stats = compute_statistics(p95_latencies)
    p99_lat_stats = compute_statistics(p99_latencies)
    pods_stats = compute_statistics(max_pods)
    
    # Resource Utilization Efficiency: Throughput per allocated CPU core
    # η = RPS / (Allocated_Cores * Mean_Pods)
    effective_cores = cpu_limit_cores * max(pods_stats["mean"], 1.0)
    resource_efficiency_score = round(rps_stats["mean"] / effective_cores, 2) if effective_cores > 0 else 0.0
    
    total_req_sum = sum(total_requests)
    total_fail_sum = sum(failure_counts)
    error_rate_pct = round((total_fail_sum / total_req_sum * 100.0), 2) if total_req_sum > 0 else 0.0
    
    processed_doc = {
        "experiment_id": exp_id,
        "processed_at": pd.Timestamp.now().isoformat(),
        "configuration": cfg,
        "resource_metrics": {
            "cpu_request_cores": parse_cpu_cores(cfg.get("resource_details", {}).get("cpu_request", "250m")),
            "cpu_limit_cores": cpu_limit_cores,
            "memory_request_mb": parse_memory_mb(cfg.get("resource_details", {}).get("memory_request", "256Mi")),
            "memory_limit_mb": mem_limit_mb
        },
        "statistical_results": {
            "repetitions_count": len(trials),
            "throughput_rps": rps_stats,
            "average_latency_ms": avg_lat_stats,
            "p50_latency_ms": compute_statistics(p50_latencies),
            "p90_latency_ms": compute_statistics(p90_latencies),
            "p95_latency_ms": p95_lat_stats,
            "p99_latency_ms": p99_lat_stats,
            "pod_count": pods_stats,
            "total_requests": total_req_sum,
            "failed_requests": total_fail_sum,
            "error_rate_percent": error_rate_pct,
            "resource_efficiency_score": resource_efficiency_score
        }
    }
    
    # Save processed file
    out_path = os.path.join(PROCESSED_DIR, f"{exp_id}_processed.json")
    with open(out_path, "w") as f:
        json.dump(processed_doc, f, indent=2)
        
    return processed_doc


def main():
    raw_files = sorted(glob.glob(os.path.join(RAW_DIR, "EXP-*.json")))
    if not raw_files:
        print("[Parse] No raw experiment data found in experiments/raw/. Experimental data not available.")
        return
        
    print(f"[Parse] Processing {len(raw_files)} raw experiment files...")
    all_processed = []
    
    for rf in raw_files:
        res = process_raw_experiment(rf)
        if res:
            all_processed.append(res)
            
    # Print summary table
    table_rows = []
    for p in all_processed:
        cfg = p["configuration"]
        stats = p["statistical_results"]
        table_rows.append([
            p["experiment_id"],
            cfg.get("resource_profile", "").upper(),
            cfg.get("workload_profile", "").upper(),
            cfg.get("scaling_mode", "").upper(),
            f"{stats['throughput_rps']['mean']} ± {stats['throughput_rps']['std_dev']}",
            f"{stats['average_latency_ms']['mean']} ± {stats['average_latency_ms']['std_dev']}",
            f"{stats['p95_latency_ms']['mean']} ± {stats['p95_latency_ms']['std_dev']}",
            f"{stats['pod_count']['mean']}",
            f"{stats['resource_efficiency_score']}"
        ])
        
    headers = ["Exp ID", "Profile", "Workload", "Scaling", "RPS (req/s)", "Avg Latency (ms)", "P95 Latency (ms)", "Avg Pods", "Efficiency (RPS/Core)"]
    print("\n" + tabulate(table_rows, headers=headers, tablefmt="github"))


if __name__ == "__main__":
    main()
