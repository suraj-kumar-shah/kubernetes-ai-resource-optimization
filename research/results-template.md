# Research Results & Empirical Findings Template

## 1. Experimental Environment & Limitations

### 1.1 Local Testbed Specification
- **Host Architecture**: Local Docker Desktop / Kubernetes Engine
- **Host CPU**: [Sampled via `GET /system-info`]
- **Host Memory**: [Sampled via `GET /system-info`]
- **Kubernetes Version**: Local Docker Desktop Kubernetes
- **Container Runtime**: containerd

> [!WARNING]
> **Research Limitations**: Results collected in a local Docker Desktop / Kubernetes environment reflect the scheduling and CFS throttling characteristics of the host system. While comparative trends between profiles and autoscaling policies remain valid, absolute latencies and scaling response times should not be directly generalized to multi-node bare-metal or cloud-managed clusters without validation.

---

## 2. Empirical Data Summary Table

*(Note: Data must be populated directly from `experiments/processed/` without fabrication)*

| Exp ID | Profile | Workload | Scaling | Mean RPS | Avg Lat (ms) | P95 Lat (ms) | Pod Count | Efficiency ($\eta$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *EXP-2026-001* | *LOW* | *LOW* | *FIXED* | - | - | - | - | - |
| *EXP-2026-002* | *LOW* | *MED* | *HPA* | - | - | - | - | - |

---

## 3. Evidence-Based Research Findings

*Guideline: State strictly what the empirical data indicates. For example:*
- *"Under the Low CPU profile ($250\text{m}$ limit), increasing load from 10 to 60 users increased $p_{95}$ latency from $X\text{ ms}$ to $Y\text{ ms}$ due to CPU throttling."*
- *"Enabling HPA reduced $p_{95}$ tail latency by $Z\%$ under high workload by scaling replicas from 1 to $N$."*
- *"The High resource profile achieved a higher maximum throughput of $A\text{ RPS}$, but reduced resource efficiency score $\eta$ by $B\%$ under light load due to idle over-provisioning."*
