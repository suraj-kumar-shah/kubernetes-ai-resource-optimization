#!/usr/bin/env python3
"""
Publication-Quality Research Visualization Generator for Kubernetes AI Workload Optimization Study.
Renders high-resolution vector and raster charts from real experiment data.
"""

import os
import glob
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
PROCESSED_DIR = os.path.join(BASE_DIR, "experiments/processed")
GRAPHS_DIR = os.path.join(BASE_DIR, "experiments/graphs")

os.makedirs(GRAPHS_DIR, exist_ok=True)

# Set publication style
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams.update({
    'font.size': 12,
    'axes.labelsize': 14,
    'axes.titlesize': 15,
    'xtick.labelsize': 12,
    'ytick.labelsize': 12,
    'legend.fontsize': 12,
    'figure.titlesize': 16,
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight'
})

PALETTE = {
    "low": "#3498db",       # Blue
    "medium": "#2ecc71",    # Green
    "high": "#e74c3c",      # Red
    "fixed": "#7f8c8d",     # Grey
    "hpa": "#9b59b6"        # Purple
}


def load_all_processed_data() -> pd.DataFrame:
    """Loads all processed experiment JSON files into a flat pandas DataFrame."""
    files = glob.glob(os.path.join(PROCESSED_DIR, "*_processed.json"))
    if not files:
        return pd.DataFrame()
        
    records = []
    for f in files:
        try:
            with open(f, "r") as jf:
                d = json.load(jf)
                cfg = d["configuration"]
                res = d["resource_metrics"]
                stats = d["statistical_results"]
                
                records.append({
                    "experiment_id": d["experiment_id"],
                    "resource_profile": cfg.get("resource_profile", "medium"),
                    "workload_profile": cfg.get("workload_profile", "medium"),
                    "scaling_mode": cfg.get("scaling_mode", "fixed"),
                    "cpu_limit_cores": res.get("cpu_limit_cores", 0.5),
                    "memory_limit_mb": res.get("memory_limit_mb", 512.0),
                    "throughput_mean": stats["throughput_rps"]["mean"],
                    "throughput_std": stats["throughput_rps"]["std_dev"],
                    "avg_latency_mean": stats["average_latency_ms"]["mean"],
                    "avg_latency_std": stats["average_latency_ms"]["std_dev"],
                    "p50_latency_mean": stats["p50_latency_ms"]["mean"],
                    "p95_latency_mean": stats["p95_latency_ms"]["mean"],
                    "p95_latency_std": stats["p95_latency_ms"]["std_dev"],
                    "p99_latency_mean": stats["p99_latency_ms"]["mean"],
                    "pod_count_mean": stats["pod_count"]["mean"],
                    "efficiency_score": stats["resource_efficiency_score"],
                    "error_rate_pct": stats["error_rate_percent"]
                })
        except Exception as e:
            print(f"[Warning] Failed to read {f}: {e}")
            
    df = pd.DataFrame(records)
    # Sort logically
    profile_order = {"low": 1, "medium": 2, "high": 3}
    workload_order = {"low": 1, "medium": 2, "high": 3}
    if not df.empty:
        if "resource_profile" in df.columns:
            df["profile_rank"] = df["resource_profile"].map(profile_order).fillna(2)
        if "workload_profile" in df.columns:
            df["workload_rank"] = df["workload_profile"].map(workload_order).fillna(2)
        df = df.sort_values(by=["profile_rank", "workload_rank"])
    return df


def plot_workload_vs_avg_latency(df: pd.DataFrame):
    """1. Workload vs Average Latency across Resource Profiles."""
    plt.figure(figsize=(9, 6))
    for profile in df["resource_profile"].unique():
        sub = df[(df["resource_profile"] == profile) & (df["scaling_mode"] == "fixed")].sort_values("workload_rank")
        if not sub.empty:
            plt.errorbar(
                sub["workload_profile"].str.capitalize(),
                sub["avg_latency_mean"],
                yerr=sub["avg_latency_std"],
                label=f"{profile.capitalize()} Profile (Fixed)",
                marker='o',
                linewidth=2.5,
                capsize=5,
                color=PALETTE.get(profile, "#333333")
            )
            
    plt.title("Impact of Workload Intensity on Mean Response Time")
    plt.xlabel("Request Load Intensity Profile")
    plt.ylabel("Average Response Time (ms)")
    plt.legend(frameon=True)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, "workload_vs_avg_latency.png"))
    plt.close()


def plot_workload_vs_p95_latency(df: pd.DataFrame):
    """2. Workload vs P95 Tail Latency."""
    plt.figure(figsize=(9, 6))
    for profile in df["resource_profile"].unique():
        sub = df[(df["resource_profile"] == profile)].sort_values("workload_rank")
        if not sub.empty:
            plt.plot(
                sub["workload_profile"].str.capitalize(),
                sub["p95_latency_mean"],
                marker='s',
                linewidth=2.5,
                label=f"{profile.capitalize()} Resource Profile",
                color=PALETTE.get(profile, "#333333")
            )
            
    plt.title("P95 Tail Latency Distribution Across Workload Levels")
    plt.xlabel("Workload Level")
    plt.ylabel("P95 Latency (ms)")
    plt.legend(frameon=True)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, "workload_vs_p95_latency.png"))
    plt.close()


def plot_cpu_allocation_vs_latency(df: pd.DataFrame):
    """3. CPU Allocation vs Response Latency."""
    plt.figure(figsize=(9, 6))
    for wl in df["workload_profile"].unique():
        sub = df[(df["workload_profile"] == wl) & (df["scaling_mode"] == "fixed")].sort_values("cpu_limit_cores")
        if not sub.empty:
            plt.plot(
                sub["cpu_limit_cores"],
                sub["avg_latency_mean"],
                marker='^',
                linewidth=2.5,
                label=f"{wl.capitalize()} Workload"
            )
            
    plt.title("Effect of CPU Limit Allocation on Latency")
    plt.xlabel("Allocated CPU Limit (Cores)")
    plt.ylabel("Average Response Time (ms)")
    plt.legend(frameon=True)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, "cpu_allocation_vs_latency.png"))
    plt.close()


def plot_workload_vs_throughput(df: pd.DataFrame):
    """4. Workload vs Throughput (RPS)."""
    plt.figure(figsize=(9, 6))
    for profile in df["resource_profile"].unique():
        sub = df[(df["resource_profile"] == profile) & (df["scaling_mode"] == "fixed")].sort_values("workload_rank")
        if not sub.empty:
            plt.bar(
                sub["workload_profile"].str.capitalize(),
                sub["throughput_mean"],
                alpha=0.7,
                label=f"{profile.capitalize()} Profile"
            )
            
    plt.title("System Throughput Across Workload Configurations")
    plt.xlabel("Workload Level")
    plt.ylabel("Throughput (Requests / Second)")
    plt.legend(frameon=True)
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, "workload_vs_throughput.png"))
    plt.close()


def plot_fixed_vs_hpa(df: pd.DataFrame):
    """5. Fixed Replicas vs HPA Comparison."""
    plt.figure(figsize=(10, 6))
    if "scaling_mode" in df.columns:
        sns.barplot(
            data=df,
            x="workload_profile",
            y="p95_latency_mean",
            hue="scaling_mode",
            palette={"fixed": "#95a5a6", "hpa": "#8e44ad"}
        )
        plt.title("P95 Latency Comparison: Fixed Replicas (1 Pod) vs HPA Autoscaling")
        plt.xlabel("Workload Profile")
        plt.ylabel("P95 Tail Latency (ms)")
        plt.legend(title="Scaling Architecture", frameon=True)
        plt.tight_layout()
        plt.savefig(os.path.join(GRAPHS_DIR, "fixed_vs_hpa_comparison.png"))
        plt.close()


def plot_workload_vs_pod_count(df: pd.DataFrame):
    """6. Workload vs Pod Scaling Count."""
    plt.figure(figsize=(9, 6))
    hpa_sub = df[df["scaling_mode"] == "hpa"].sort_values("workload_rank")
    if not hpa_sub.empty:
        plt.plot(
            hpa_sub["workload_profile"].str.capitalize(),
            hpa_sub["pod_count_mean"],
            marker='o',
            color="#8e44ad",
            linewidth=3,
            label="HPA Active Replicas"
        )
        plt.title("HPA Pod Scale-Out Across Increasing Workloads")
        plt.xlabel("Workload Profile")
        plt.ylabel("Maximum Pod Replicas Allocated")
        plt.ylim(0, 10)
        plt.legend(frameon=True)
        plt.tight_layout()
        plt.savefig(os.path.join(GRAPHS_DIR, "workload_vs_pod_count.png"))
        plt.close()


def plot_resource_efficiency_pareto(df: pd.DataFrame):
    """7. Resource Efficiency (RPS / CPU Core) Pareto Front."""
    plt.figure(figsize=(9, 6))
    plt.scatter(
        df["cpu_limit_cores"],
        df["efficiency_score"],
        s=df["throughput_mean"] * 15 + 50,
        c=df["avg_latency_mean"],
        cmap="viridis_r",
        alpha=0.8,
        edgecolors="black"
    )
    cbar = plt.colorbar()
    cbar.set_label("Mean Latency (ms)")
    plt.title("Resource Efficiency (RPS / Core) vs CPU Allocation")
    plt.xlabel("Allocated CPU Cores")
    plt.ylabel(r"Resource Efficiency Score $\eta$ (RPS / Core)")
    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, "resource_efficiency_pareto.png"))
    plt.close()


def main():
    df = load_all_processed_data()
    if df.empty:
        print("[Visualizer] No processed experiment data found. Experimental data not available.")
        return
        
    print(f"[Visualizer] Generating publication-quality charts from {len(df)} experiment conditions...")
    plot_workload_vs_avg_latency(df)
    plot_workload_vs_p95_latency(df)
    plot_cpu_allocation_vs_latency(df)
    plot_workload_vs_throughput(df)
    plot_fixed_vs_hpa(df)
    plot_workload_vs_pod_count(df)
    plot_resource_efficiency_pareto(df)
    print(f"[Visualizer] Successfully saved all publication figures to {GRAPHS_DIR}/")


if __name__ == "__main__":
    main()
