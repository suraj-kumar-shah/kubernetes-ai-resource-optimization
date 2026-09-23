# Load Testing Suite (Locust)

This directory contains the workload generators for evaluating the AI service under controlled synthetic loads.

## Scenarios
1. **Steady Workload** (`scenarios/steady_load.conf`): 15 concurrent users, 3 users/sec spawn rate.
2. **Step Workload** (`scenarios/step_load.conf`): 35 concurrent users, 5 users/sec spawn rate.
3. **Spike Workload** (`scenarios/spike_load.conf`): 60 concurrent users, 20 users/sec spawn rate.

## Running Tests Manually

### Headless CLI Mode:
```bash
locust --config load-testing/scenarios/steady_load.conf
```

### Interactive Web UI Mode:
```bash
locust -f load-testing/locustfile.py --host http://localhost:30080
```
Open `http://localhost:8089` in your web browser to configure users and start generation.
