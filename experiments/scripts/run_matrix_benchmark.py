#!/usr/bin/env python3
"""
Factorial Experiment Runner & Benchmark Orchestrator for Kubernetes AI Workload Optimization.

Executes controlled scientific experiments across:
- Resource Profiles: LOW, MEDIUM, HIGH
- Workloads: LOW, MEDIUM, HIGH
- Scaling Modes: FIXED (1 Pod), HPA (Autoscaling)
- Repetitions: 3+ iterations for statistical validity
"""

import os
import sys
import time
import json
import uuid
import datetime
import subprocess
import argparse
import requests
import glob
import pandas as pd

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
CONFIG_PATH = os.path.join(BASE_DIR, "experiments/configurations/matrix.json")
RAW_DIR = os.path.join(BASE_DIR, "experiments/raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "experiments/processed")
GRAPHS_DIR = os.path.join(BASE_DIR, "experiments/graphs")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(GRAPHS_DIR, exist_ok=True)


def get_next_experiment_id() -> str:
    """Generates a monotonically increasing experiment ID (e.g. EXP-2026-001)."""
    year = datetime.datetime.now().year
    existing_files = glob.glob(os.path.join(RAW_DIR, f"EXP-{year}-*.json"))
    max_seq = 0
    for f in existing_files:
        basename = os.path.basename(f)
        try:
            parts = basename.replace(".json", "").split("-")
            if len(parts) >= 3:
                seq = int(parts[2])
                if seq > max_seq:
                    max_seq = seq
        except Exception:
            pass
    return f"EXP-{year}-{max_seq + 1:03d}"


def run_cmd(cmd: str, check: bool = True) -> str:
    """Executes a shell command and returns output."""
    res = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if check and res.returncode != 0:
        print(f"[Warning/Error] Command failed: {cmd}\nStderr: {res.stderr}")
    return res.stdout.strip()


def apply_resource_profile(profile_key: str, profile_info: dict):
    """Applies K8s resource profile manifest and waits for rollout."""
    manifest_path = os.path.join(BASE_DIR, profile_info["manifest"])
    print(f"\n[Profile] Applying {profile_info['name']} ({profile_info['cpu_request']}/{profile_info['cpu_limit']} CPU)...")
    run_cmd(f"kubectl apply -f {manifest_path} -n ai-workload", check=False)
    # Wait for rollout completion
    run_cmd("kubectl rollout status deployment/ai-workload-backend -n ai-workload --timeout=60s", check=False)
    time.sleep(3)


def configure_scaling(scaling_mode: str, hpa_manifest: str):
    """Configures FIXED replicas or HPA autoscaling."""
    manifest_path = os.path.join(BASE_DIR, hpa_manifest)
    if scaling_mode.lower() == "hpa":
        print("[Scaling] Enabling Horizontal Pod Autoscaler (HPA v2)...")
        run_cmd(f"kubectl apply -f {manifest_path} -n ai-workload", check=False)
    else:
        print("[Scaling] Setting FIXED scaling mode (1 Replica)...")
        run_cmd("kubectl delete hpa ai-workload-hpa -n ai-workload --ignore-not-found=true", check=False)
        run_cmd("kubectl scale deployment/ai-workload-backend --replicas=1 -n ai-workload", check=False)
        run_cmd("kubectl rollout status deployment/ai-workload-backend -n ai-workload --timeout=60s", check=False)
    time.sleep(3)


def check_target_healthy(host: str) -> bool:
    """Checks if the AI service endpoint is reachable and healthy."""
    try:
        r = requests.get(f"{host}/readyz", timeout=3)
        return r.status_code == 200
    except Exception:
        return False


def get_pod_metrics() -> dict:
    """Samples current pod count and resource usage via kubectl."""
    pods_out = run_cmd("kubectl get pods -n ai-workload -l app=ai-workload-backend --no-headers", check=False)
    pod_lines = [l for l in pods_out.split("\n") if l.strip()]
    ready_pods = sum(1 for l in pod_lines if "Running" in l and "1/1" in l)
    total_pods = len(pod_lines)
    
    # Try kubectl top pods
    top_out = run_cmd("kubectl top pods -n ai-workload -l app=ai-workload-backend --no-headers", check=False)
    pod_usages = []
    for line in top_out.split("\n"):
        parts = line.split()
        if len(parts) >= 3:
            pod_usages.append({"pod": parts[0], "cpu": parts[1], "memory": parts[2]})
            
    return {
        "ready_pods": ready_pods,
        "total_pods": total_pods,
        "pod_usages": pod_usages,
        "timestamp": time.time()
    }


def execute_locust_run(host: str, users: int, spawn_rate: int, duration_sec: int, complexity_factor: int, csv_prefix: str) -> dict:
    """Executes a headless Locust load test run and parses CSV results."""
    locustfile = os.path.join(BASE_DIR, "load-testing/locustfile.py")
    env = os.environ.copy()
    env["LOCUST_COMPLEXITY_FACTOR"] = str(complexity_factor)
    
    cmd = (
        f"locust -f {locustfile} --headless "
        f"--host {host} "
        f"-u {users} -r {spawn_rate} "
        f"--run-time {duration_sec}s "
        f"--csv {csv_prefix} "
        f"--csv-full-history"
    )
    
    print(f"[Locust] Executing load test: {users} users, {spawn_rate}/s spawn, {duration_sec}s duration...")
    run_cmd(cmd, check=False)
    
    # Parse the generated stats CSV
    stats_file = f"{csv_prefix}_stats.csv"
    stats_history = f"{csv_prefix}_stats_history.csv"
    
    locust_metrics = {
        "request_count": 0,
        "failure_count": 0,
        "median_response_time": 0.0,
        "average_response_time": 0.0,
        "min_response_time": 0.0,
        "max_response_time": 0.0,
        "current_rps": 0.0,
        "p50_ms": 0.0,
        "p90_ms": 0.0,
        "p95_ms": 0.0,
        "p99_ms": 0.0,
        "endpoints": []
    }
    
    if os.path.exists(stats_file):
        try:
            df = pd.read_csv(stats_file)
            total_row = df[df["Name"] == "Aggregated"]
            if not total_row.empty:
                row = total_row.iloc[0]
                locust_metrics["request_count"] = int(row.get("Request Count", 0))
                locust_metrics["failure_count"] = int(row.get("Failure Count", 0))
                locust_metrics["median_response_time"] = float(row.get("Median Response Time", 0.0))
                locust_metrics["average_response_time"] = float(row.get("Average Response Time", 0.0))
                locust_metrics["min_response_time"] = float(row.get("Min Response Time", 0.0))
                locust_metrics["max_response_time"] = float(row.get("Max Response Time", 0.0))
                locust_metrics["current_rps"] = float(row.get("Requests/s", 0.0))
                locust_metrics["p50_ms"] = float(row.get("50%", 0.0))
                locust_metrics["p90_ms"] = float(row.get("90%", 0.0))
                locust_metrics["p95_ms"] = float(row.get("95%", 0.0))
                locust_metrics["p99_ms"] = float(row.get("99%", 0.0))
                
            # Individual endpoints
            for _, r in df.iterrows():
                if r.get("Name") != "Aggregated":
                    locust_metrics["endpoints"].append({
                        "name": str(r.get("Name", "")),
                        "type": str(r.get("Type", "")),
                        "requests": int(r.get("Request Count", 0)),
                        "failures": int(r.get("Failure Count", 0)),
                        "avg_response_time": float(r.get("Average Response Time", 0.0)),
                        "p95": float(r.get("95%", 0.0))
                    })
        except Exception as e:
            print(f"[Warning] Error parsing Locust CSV: {e}")
            
    # Cleanup CSV files
    for f in glob.glob(f"{csv_prefix}*.csv"):
        try:
            os.remove(f)
        except Exception:
            pass
            
    return locust_metrics


def run_experiment_condition(exp_id: str, profile_key: str, profile_info: dict,
                             workload_key: str, workload_info: dict,
                             scaling_mode: str, hpa_manifest: str,
                             repetition_idx: int, host: str) -> dict:
    """Executes a single repeated experiment trial."""
    print(f"\n{'='*70}")
    print(f"RUNNING: {exp_id} | Profile: {profile_key.upper()} | Workload: {workload_key.upper()} | Scaling: {scaling_mode.upper()} | Run: {repetition_idx + 1}")
    print(f"{'='*70}")
    
    # 1. Apply Resource Profile
    apply_resource_profile(profile_key, profile_info)
    
    # 2. Configure Scaling
    configure_scaling(scaling_mode, hpa_manifest)
    
    # 3. Check health and warm up
    print("[Warmup] Waiting for pod health stabilization...")
    for _ in range(10):
        if check_target_healthy(host):
            break
        time.sleep(2)
        
    # Warmup queries
    try:
        for _ in range(5):
            requests.post(f"{host}/predict", json={"text": "Warmup request", "complexity_factor": 1}, timeout=3)
    except Exception:
        pass
        
    # 4. Measure initial pod metrics
    initial_metrics = get_pod_metrics()
    
    # 5. Run Locust
    csv_temp_prefix = os.path.join(RAW_DIR, f"temp_locust_{uuid.uuid4().hex[:8]}")
    t_start = time.time()
    
    locust_res = execute_locust_run(
        host=host,
        users=workload_info["users"],
        spawn_rate=workload_info["spawn_rate"],
        duration_sec=workload_info["duration_seconds"],
        complexity_factor=workload_info["complexity_factor"],
        csv_prefix=csv_temp_prefix
    )
    t_end = time.time()
    
    # 6. Measure post pod metrics
    post_metrics = get_pod_metrics()
    
    trial_data = {
        "trial_id": f"{exp_id}_r{repetition_idx + 1}",
        "repetition_index": repetition_idx + 1,
        "timestamp_start": t_start,
        "timestamp_end": t_end,
        "duration_actual_sec": round(t_end - t_start, 2),
        "initial_pods": initial_metrics["ready_pods"],
        "final_pods": post_metrics["ready_pods"],
        "max_pods_observed": max(initial_metrics["ready_pods"], post_metrics["ready_pods"]),
        "locust_results": locust_res,
        "pod_usages": post_metrics["pod_usages"]
    }
    
    return trial_data


def main():
    parser = argparse.ArgumentParser(description="Kubernetes AI Workload Experiment Runner")
    parser.add_argument("--profile", choices=["low", "medium", "high", "all"], default="all")
    parser.add_argument("--workload", choices=["low", "medium", "high", "all"], default="all")
    parser.add_argument("--scaling", choices=["fixed", "hpa", "all"], default="all")
    parser.add_argument("--repetitions", type=int, default=3, help="Repetitions per condition (min 3 recommended)")
    parser.add_argument("--host", default="http://localhost:30080", help="AI service endpoint")
    args = parser.parse_args()
    
    with open(CONFIG_PATH, "r") as f:
        config = json.load(f)
        
    profiles = [args.profile] if args.profile != "all" else list(config["profiles"].keys())
    workloads = [args.workload] if args.workload != "all" else list(config["workloads"].keys())
    scaling_modes = [args.scaling] if args.scaling != "all" else config["scaling_modes"]
    repetitions = args.repetitions
    
    print("==================================================================")
    print("AI Workload Kubernetes Factorial Experiment Runner")
    print(f"Profiles: {profiles}")
    print(f"Workloads: {workloads}")
    print(f"Scaling Modes: {scaling_modes}")
    print(f"Repetitions per Condition: {repetitions}")
    print(f"Target Host: {args.host}")
    print("==================================================================")
    
    for prof in profiles:
        for wl in workloads:
            for sc in scaling_modes:
                exp_id = get_next_experiment_id()
                trials = []
                
                for rep in range(repetitions):
                    trial = run_experiment_condition(
                        exp_id=exp_id,
                        profile_key=prof,
                        profile_info=config["profiles"][prof],
                        workload_key=wl,
                        workload_info=config["workloads"][wl],
                        scaling_mode=sc,
                        hpa_manifest=config["hpa_manifest"],
                        repetition_idx=rep,
                        host=args.host
                    )
                    trials.append(trial)
                    time.sleep(config.get("cooldown_between_runs_seconds", 5))
                    
                # Save complete raw experiment file
                raw_experiment_doc = {
                    "experiment_id": exp_id,
                    "created_at": datetime.datetime.now().isoformat(),
                    "configuration": {
                        "resource_profile": prof,
                        "resource_details": config["profiles"][prof],
                        "workload_profile": wl,
                        "workload_details": config["workloads"][wl],
                        "scaling_mode": sc,
                        "repetitions": repetitions
                    },
                    "trials": trials
                }
                
                raw_file_path = os.path.join(RAW_DIR, f"{exp_id}.json")
                with open(raw_file_path, "w") as f:
                    json.dump(raw_experiment_doc, f, indent=2)
                    
                print(f"\n[Saved] Raw experiment data recorded to {raw_file_path}")
                
    # Run analysis parser and graph generator
    print("\n[Analysis] Processing raw experiment telemetry and generating graphs...")
    run_cmd("python3 experiments/scripts/parse_metrics.py", check=False)
    run_cmd("python3 experiments/scripts/generate_visualizations.py", check=False)
    print("[Done] Benchmark matrix execution complete.")


if __name__ == "__main__":
    main()
