"""
Locust load testing suite for AI Workload in Kubernetes.
Generates realistic inference requests across varied sentence lengths and complexity factors.
"""

from locust import HttpUser, task, between, events
import random
import os
import json

# Curated benchmark prompts representing different scientific domains and token lengths
BENCHMARK_PROMPTS = [
    # Short queries
    "Kubernetes autoscaler with resource limit.",
    "Neural network backpropagation calculus.",
    "Quantum superposition Hilbert space.",
    "CRISPR gene editing sequence alignment.",
    "Macroeconomic monetary policy inflation rate.",

    # Medium queries
    "Horizontal Pod Autoscaling dynamically scales deployment replicas based on CPU threshold and memory usage.",
    "Transformer attention mechanisms compute scaled dot-product attention over key, query, and value projection matrices.",
    "Quantum error correction codes protect fragile quantum information against environmental decoherence and bit flips.",
    "Next-generation RNA sequencing measures transcriptome expression levels across differential cellular tissue types.",
    "Game-theoretic Nash equilibrium identifies optimal strategy profiles where no player has incentive to unilaterally deviate.",

    # Long queries
    "Microservice network latency is governed by RPC serialization overhead, network hops, and container socket buffers when running distributed container clusters.",
    "Deep reinforcement learning optimizes policy gradients to maximize cumulative expected discounted reward signals in stochastic markov environments.",
    "Stochastic volatility models simulate asset price fluctuations and option derivative pricing under generalized Black-Scholes partial differential equations.",
    "Superconducting Josephson junctions form the fundamental physical foundation of transmon qubits in superconducting quantum processors with microwave control."
]

COMPLEXITY_FACTOR = int(os.getenv("LOCUST_COMPLEXITY_FACTOR", "1"))


class AIWorkloadUser(HttpUser):
    # Think-time between requests (simulates realistic client inter-arrival intervals)
    wait_time = between(0.05, 0.2)

    @task(7)
    def test_single_predict(self):
        """Single text inference endpoint test."""
        prompt = random.choice(BENCHMARK_PROMPTS)
        payload = {
            "text": prompt,
            "complexity_factor": COMPLEXITY_FACTOR
        }
        headers = {"Content-Type": "application/json"}
        with self.client.post("/predict", json=payload, headers=headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if "prediction" in data:
                    response.success()
                else:
                    response.failure("Malformed response body")
            else:
                response.failure(f"HTTP {response.status_code}: {response.text}")

    @task(2)
    def test_batch_predict(self):
        """Batched text inference endpoint test."""
        batch_size = random.choice([2, 4, 8])
        prompts = random.choices(BENCHMARK_PROMPTS, k=batch_size)
        payload = {
            "texts": prompts,
            "complexity_factor": COMPLEXITY_FACTOR
        }
        headers = {"Content-Type": "application/json"}
        with self.client.post("/batch_predict", json=payload, headers=headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"HTTP {response.status_code}")

    @task(1)
    def test_system_info(self):
        """Periodic health and node telemetry query."""
        self.client.get("/system-info", name="/system-info")
