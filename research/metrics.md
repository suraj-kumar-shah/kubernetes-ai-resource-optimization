# Research Metrics: Mathematical Formulations & Definitions

## 1. Latency Percentiles

For a sample set of response times $L = \{l_1, l_2, \dots, l_M\}$ sorted in ascending order:

### 1.1 Median Latency ($p_{50}$)
$$p_{50} = L_{\lfloor 0.50 \cdot M \rfloor}$$
Measures the typical user experience under regular operating conditions.

### 1.2 Tail Latency ($p_{95}, p_{99}$)
$$p_{95} = L_{\lfloor 0.95 \cdot M \rfloor}, \quad p_{99} = L_{\lfloor 0.99 \cdot M \rfloor}$$
Crucial for evaluating Service Level Objectives (SLOs) and measuring worst-case queuing delays caused by CPU throttling and autoscaler lag.

---

## 2. System Throughput

$$\text{Throughput (RPS)} = \frac{M_{successful}}{\Delta t}$$
Where $M_{successful}$ is the count of successful HTTP 200 responses received during the measurement window $\Delta t$ in seconds.

---

## 3. Resource Utilization Efficiency ($\eta$)

To evaluate the trade-off between hardware over-provisioning and throughput:

$$\eta = \frac{\text{Throughput (RPS)}}{\text{Allocated CPU Cores} \times \bar{N}_{replicas}}$$

- **Units**: $\text{Requests} \cdot \text{s}^{-1} \cdot \text{Core}^{-1}$
- High $\eta$ indicates efficient hardware utilization with minimal idle headroom.
- Low $\eta$ indicates over-provisioning or excessive resource idling.

---

## 4. Autoscaling Dynamics

### 4.1 Scale-Out Response Time ($T_{scale}$)
$$T_{scale} = t_{ready} - t_{threshold}$$
Where $t_{threshold}$ is the timestamp at which average CPU exceeds the $60\%$ target, and $t_{ready}$ is the timestamp at which new pod replicas pass readiness probes and receive traffic.
