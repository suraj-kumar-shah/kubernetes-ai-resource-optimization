# Experiment Design: Factorial Matrix & Statistical Rigor

## 1. Full Factorial Design ($3 \times 3 \times 2$)

To evaluate the non-linear interactions between compute limits, workload intensity, and autoscaling, we implement a full factorial experiment matrix yielding 18 distinct experimental conditions:

$$\text{Total Conditions} = |\text{Profiles}| \times |\text{Workloads}| \times |\text{Scaling Modes}| = 3 \times 3 \times 2 = 18$$

| Condition ID | Resource Profile | Workload Level | Scaling Mode | Repetitions |
| :--- | :--- | :--- | :--- | :--- |
| C01 | Low (250m CPU) | Low (10 Users) | Fixed (1 Pod) | 3 |
| C02 | Low (250m CPU) | Low (10 Users) | HPA Enabled | 3 |
| C03 | Low (250m CPU) | Med (30 Users) | Fixed (1 Pod) | 3 |
| C04 | Low (250m CPU) | Med (30 Users) | HPA Enabled | 3 |
| C05 | Low (250m CPU) | High (60 Users) | Fixed (1 Pod) | 3 |
| C06 | Low (250m CPU) | High (60 Users) | HPA Enabled | 3 |
| C07 | Med (500m CPU) | Low (10 Users) | Fixed (1 Pod) | 3 |
| C08 | Med (500m CPU) | Low (10 Users) | HPA Enabled | 3 |
| C09 | Med (500m CPU) | Med (30 Users) | Fixed (1 Pod) | 3 |
| C10 | Med (500m CPU) | Med (30 Users) | HPA Enabled | 3 |
| C11 | Med (500m CPU) | High (60 Users) | Fixed (1 Pod) | 3 |
| C12 | Med (500m CPU) | High (60 Users) | HPA Enabled | 3 |
| C13 | High (1200m CPU) | Low (10 Users) | Fixed (1 Pod) | 3 |
| C14 | High (1200m CPU) | Low (10 Users) | HPA Enabled | 3 |
| C15 | High (1200m CPU) | Med (30 Users) | Fixed (1 Pod) | 3 |
| C16 | High (1200m CPU) | Med (30 Users) | HPA Enabled | 3 |
| C17 | High (1200m CPU) | High (60 Users) | Fixed (1 Pod) | 3 |
| C18 | High (1200m CPU) | High (60 Users) | HPA Enabled | 3 |

---

## 2. Statistical Treatment & Repetition Policy

To eliminate random transient noise (e.g. host garbage collection, context switches, OS scheduling jitter):
- Each condition $C_k$ is executed across $N \ge 3$ repeated trials.
- For each metric $X$, we calculate:
  - **Sample Mean**: $\bar{X} = \frac{1}{N} \sum_{i=1}^N X_i$
  - **Sample Standard Deviation**: $s = \sqrt{\frac{1}{N-1} \sum_{i=1}^N (X_i - \bar{X})^2}$
  - **Median & Percentiles**: Empirical $p_{50}, p_{90}, p_{95}, p_{99}$ computed over sample distributions.
- Claims of superiority or degradation must be substantiated by non-overlapping confidence intervals or explicit empirical deltas.

---

## 3. Threat to Validity & Mitigation

1. **Cold Start Bias**: Mitigated by running an automated warm-up cycle prior to starting telemetry recording.
2. **HPA Cool-down Hysteresis**: Mitigated by enforcing a 10s stabilization window between consecutive experimental runs.
3. **Data Overwrites**: Mitigated by atomic monotonic file naming (`EXP-YYYY-XXX.json`).
