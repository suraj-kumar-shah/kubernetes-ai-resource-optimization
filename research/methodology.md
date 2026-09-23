# Methodology: Optimizing AI Workloads in Kubernetes-Based Environments

## 1. Research Overview & Problem Statement

As machine learning and deep learning inference services become core building blocks of modern cloud and edge architectures, deploying containerized AI workloads on Kubernetes introduces critical resource allocation and autoscaling trade-offs. 

Unlike traditional stateless web services, AI inference is predominantly CPU- or GPU-bound, exhibiting high variance in computation time dependent on batch size, input token sequence length, and tensor dimensionality. Suboptimal CPU/memory allocation can cause CPU throttling via the Completely Fair Scheduler (CFS) or Out-Of-Memory (OOM) pod terminations. Furthermore, Horizontal Pod Autoscaler (HPA) reaction latency during traffic surges can lead to transient request queuing and severe tail latency spikes ($p_{95}, p_{99}$).

This research experimentally evaluates:
$$\text{Performance} = f(\text{CPU Limits}, \text{Memory Limits}, \text{HPA Policy}, \text{Workload Arrival Rate})$$

---

## 2. Experimental Variables

### 2.1 Independent Variables
1. **CPU & Memory Resource Profiles**:
   - **LOW Profile**: $150\text{ mCPU}$ Request, $250\text{ mCPU}$ Limit; $128\text{ MiB}$ Request, $256\text{ MiB}$ Limit.
   - **MEDIUM Profile**: $300\text{ mCPU}$ Request, $500\text{ mCPU}$ Limit; $256\text{ MiB}$ Request, $512\text{ MiB}$ Limit.
   - **HIGH Profile**: $800\text{ mCPU}$ Request, $1200\text{ mCPU}$ Limit; $512\text{ MiB}$ Request, $1024\text{ MiB}$ Limit.
2. **Horizontal Autoscaling Architecture**:
   - **Fixed Replicas**: Static 1 Pod baseline.
   - **HPA v2 Enabled**: Autoscaling between 1 and 8 pods targeting $60\%$ CPU utilization.
3. **Request Load Tiers**:
   - **Low Workload**: 10 concurrent virtual users ($2\text{ users/s}$ spawn).
   - **Medium Workload**: 30 concurrent virtual users ($5\text{ users/s}$ spawn).
   - **High Workload**: 60 concurrent virtual users ($10\text{ users/s}$ spawn).

### 2.2 Dependent Variables (Measured Telemetry)
- **Response Latency**: Mean, Median, $p_{50}, p_{90}, p_{95}, p_{99}$, Minimum, Maximum (ms).
- **Throughput**: Sustained requests per second (RPS).
- **Error Rate**: Percentage of HTTP 5xx or connection timeout failures ($\%$).
- **Pod Replicas**: Initial, Maximum, and Mean replica count under load.
- **Resource Efficiency Score ($\eta$)**: $\text{Throughput} / (\text{Allocated CPU Cores} \times \bar{N}_{pods})$.

### 2.3 Controlled Variables
- Standardized AI model architecture: TF-IDF n-gram vectorizer + Softmax classification.
- Consistent sentence payload distributions and vocabulary.
- Kubernetes network routing via NodePort Service.
- Deterministic load generation platform (Locust headless harness).

---

## 3. Experimental Protocol

1. **Environment Initialization**: Deploy namespace, configmap, service, and monitoring infrastructure.
2. **Resource Provisioning**: Apply target resource profile (`low.yaml`, `medium.yaml`, or `high.yaml`).
3. **Autoscaling Configuration**: Enable or disable HPA manifest.
4. **Warm-up Phase**: Issue 5 sequential synthetic requests to ensure JIT/caching stabilization and avoid cold-start bias.
5. **Load Generation**: Execute Locust workload for the designated duration ($30\text{s}-45\text{s}$).
6. **Telemetry Sampling**: Sample Locust response time percentiles and pod resource metrics.
7. **Replication**: Repeat each experimental condition at least 3 times.
8. **Cooldown Phase**: Wait 10 seconds between runs to allow CFS cgroup counters and HPA metrics to reset.
9. **Data Parsing & Archiving**: Record raw JSON trials to `experiments/raw/` with unique IDs (`EXP-YYYY-XXX.json`), aggregate statistical parameters into `experiments/processed/`, and generate publication charts into `experiments/graphs/`.
