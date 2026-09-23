import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Server,
  Activity,
  Layers,
  BarChart3,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Database,
  Terminal,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:30080";

export default function App() {
  const [activeTab, setActiveTab] = useState('inference');
  const [systemInfo, setSystemInfo] = useState(null);
  const [systemError, setSystemError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [experimentsData, setExperimentsData] = useState(null);
  const [loadingExp, setLoadingExp] = useState(false);

  // Inference State
  const [inputText, setInputText] = useState("Horizontal Pod Autoscaling dynamically scales deployment replicas based on CPU threshold and memory usage.");
  const [complexityFactor, setComplexityFactor] = useState(1);
  const [inferenceResult, setInferenceResult] = useState(null);
  const [inferring, setInferring] = useState(false);
  const [inferError, setInferError] = useState(null);

  // Benchmark State
  const [benchIterations, setBenchIterations] = useState(25);
  const [benchComplexity, setBenchComplexity] = useState(1);
  const [benchResult, setBenchResult] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchError, setBenchError] = useState(null);

  // Load initial system data
  useEffect(() => {
    fetchSystemInfo();
    fetchModelInfo();
    fetchExperimentsData();
  }, []);

  const fetchSystemInfo = async () => {
    setSystemError(null);
    try {
      const res = await fetch(`${API_BASE}/system-info`);
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
      } else {
        setSystemError(`HTTP ${res.status}: Failed to load system status from ${API_BASE}`);
      }
    } catch (e) {
      const msg = `Unable to connect to backend at ${API_BASE}. (${e.message || "Network error"})`;
      console.warn(msg, e);
      setSystemError(msg);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/model-info`);
      if (res.ok) {
        const data = await res.json();
        setModelInfo(data);
      }
    } catch (e) {
      console.warn(`Could not connect to model-info at ${API_BASE}:`, e);
    }
  };

  const fetchExperimentsData = async () => {
    setLoadingExp(true);
    try {
      const res = await fetch(`${API_BASE}/experiments/data`);
      if (res.ok) {
        const data = await res.json();
        setExperimentsData(data);
      }
    } catch (e) {
      console.warn(`Could not fetch experiment data from ${API_BASE}:`, e);
    } finally {
      setLoadingExp(false);
    }
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    setInferring(true);
    setInferError(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, complexity_factor: parseInt(complexityFactor) })
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errBody || "Server returned an error"}`);
      }
      const data = await res.json();
      setInferenceResult(data);
    } catch (err) {
      setInferError(err.message || `Failed to connect to AI backend at ${API_BASE}/predict`);
    } finally {
      setInferring(false);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    setBenchError(null);
    try {
      const res = await fetch(`${API_BASE}/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iterations: parseInt(benchIterations),
          complexity_factor: parseInt(benchComplexity)
        })
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errBody}`);
      }
      const data = await res.json();
      setBenchResult(data);
    } catch (e) {
      setBenchError(e.message || `Failed to execute benchmark at ${API_BASE}/benchmark`);
      console.error(e);
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-section">
            <div className="brand-icon-box">
              <Server size={22} />
            </div>
            <div className="brand-title-group">
              <h1>Optimizing AI Workloads in Kubernetes</h1>
              <span className="brand-subtitle">Academic Research Platform</span>
            </div>
          </div>

          <nav className="nav-tabs">
            <button
              className={`tab-button ${activeTab === 'inference' ? 'active' : ''}`}
              onClick={() => setActiveTab('inference')}
            >
              <Sparkles size={16} /> AI Inference
            </button>
            <button
              className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <Cpu size={16} /> System Status
            </button>
            <button
              className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              <Sliders size={16} /> Experiment Config
            </button>
            <button
              className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}
            >
              <Activity size={16} /> Live Metrics
            </button>
            <button
              className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => { setActiveTab('results'); fetchExperimentsData(); }}
            >
              <BarChart3 size={16} /> Research Results
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">

        {/* ================= TAB 1: AI INFERENCE ================= */}
        {activeTab === 'inference' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Terminal size={18} color="#6366f1" /> Real-time AI Inference Playground
                </div>
                <span className="badge badge-info">CPU-Bound Engine</span>
              </div>

              <form onSubmit={handlePredict}>
                <div className="form-group">
                  <label className="form-label">Input Academic Text Query</label>
                  <textarea
                    className="form-textarea"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter scientific or technical statement..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Inference Complexity Multiplier: <strong>{complexityFactor}x</strong></span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Scales tensor operations</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={complexityFactor}
                    onChange={(e) => setComplexityFactor(e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={inferring} style={{ flex: 1 }}>
                    {inferring ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
                    {inferring ? 'Processing...' : 'Run Inference'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setInputText("CRISPR Cas9 endonuclease enables targeted double-stranded DNA modifications.")}
                  >
                    Sample Prompt
                  </button>
                </div>
              </form>

              {inferError && (
                <div style={{ marginTop: '1rem', color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
                  <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  {inferError}
                </div>
              )}
            </div>

            {/* Inference Telemetry & Output */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Activity size={18} color="#10b981" /> Telemetry & Classification
                </div>
                {inferenceResult && (
                  <span className="badge badge-success">
                    <CheckCircle size={12} /> {inferenceResult.pod_name || "Local Pod"}
                  </span>
                )}
              </div>

              {inferenceResult ? (
                <div>
                  <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-box">
                      <div className="stat-title">Wall Latency</div>
                      <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                        {inferenceResult.metrics.wall_latency_ms} <span style={{ fontSize: '0.8rem' }}>ms</span>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-title">CPU Time</div>
                      <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>
                        {inferenceResult.metrics.cpu_time_ms} <span style={{ fontSize: '0.8rem' }}>ms</span>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-title">Process RSS</div>
                      <div className="stat-value">
                        {inferenceResult.metrics.process_memory_rss_mb} <span style={{ fontSize: '0.8rem' }}>MB</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Predicted Academic Topic:
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {inferenceResult.prediction.predicted_topic}
                      <span className="badge badge-purple" style={{ marginLeft: '0.75rem', verticalAlign: 'middle' }}>
                        {(inferenceResult.prediction.confidence * 100).toFixed(1)}% Confidence
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Class Probability Distribution:
                    </div>
                    {Object.entries(inferenceResult.prediction.class_probabilities).map(([cls, prob]) => (
                      <div key={cls} className="prob-row">
                        <div className="prob-label-group">
                          <span>{cls}</span>
                          <span>{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="prob-bar-track">
                          <div className="prob-bar-fill" style={{ width: `${prob * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="notice-box">
                  <Terminal size={32} className="notice-icon" />
                  <div className="notice-title">Awaiting Inference Request</div>
                  <div className="notice-desc">Submit a query from the left panel to observe live execution latency and model classifications.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SYSTEM STATUS ================= */}
        {activeTab === 'system' && (
          <div>
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Cpu size={18} color="#06b6d4" /> Host & Pod Hardware Allocation
                  </div>
                  <button className="btn btn-secondary" onClick={fetchSystemInfo} style={{ padding: '0.4rem 0.75rem' }}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>

                {systemInfo ? (
                  <div className="grid-2">
                    <div className="stat-box">
                      <div className="stat-title">Pod Identity</div>
                      <div className="stat-value" style={{ fontSize: '1.1rem' }}>{systemInfo.pod_name}</div>
                      <div className="stat-tag">Env: {systemInfo.environment}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-title">Logical Cores</div>
                      <div className="stat-value">{systemInfo.cpu_count_logical} Cores</div>
                      <div className="stat-tag">Physical: {systemInfo.cpu_count_physical}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-title">Memory Used / Total</div>
                      <div className="stat-value">{systemInfo.memory_used_mb} <span style={{ fontSize: '0.8rem' }}>/ {systemInfo.memory_total_mb} MB</span></div>
                      <div className="stat-tag">{systemInfo.memory_percent}% Allocated</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-title">Model Version</div>
                      <div className="stat-value">{systemInfo.model_version}</div>
                      <div className="stat-tag">Active Runtime</div>
                    </div>
                  </div>
                ) : (
                  <div className="notice-box">
                    {systemError ? (
                      <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
                        <AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                        {systemError}
                      </div>
                    ) : (
                      "Connecting to pod metrics at " + API_BASE + "..."
                    )}
                  </div>
                )}
              </div>

              {/* In-Pod Synthetic Benchmark */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Clock size={18} color="#f59e0b" /> Deterministic In-Pod Benchmark
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Iterations</label>
                    <input
                      type="number"
                      className="form-input"
                      value={benchIterations}
                      onChange={(e) => setBenchIterations(e.target.value)}
                      min="5"
                      max="200"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Complexity Factor</label>
                    <input
                      type="number"
                      className="form-input"
                      value={benchComplexity}
                      onChange={(e) => setBenchComplexity(e.target.value)}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleRunBenchmark} disabled={benchmarking} style={{ width: '100%', marginBottom: '1rem' }}>
                  {benchmarking ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
                  {benchmarking ? 'Benchmarking Pod...' : 'Run Micro-Benchmark'}
                </button>

                {benchError && (
                  <div style={{ marginBottom: '1rem', color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                    {benchError}
                  </div>
                )}

                {benchResult && (
                  <div className="grid-3">
                    <div className="stat-box">
                      <div className="stat-title">Throughput</div>
                      <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                        {benchResult.throughput_rps} <span style={{ fontSize: '0.75rem' }}>RPS</span>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-title">P50 Latency</div>
                      <div className="stat-value">{benchResult.latency_stats_ms.p50} ms</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-title">P95 Latency</div>
                      <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
                        {benchResult.latency_stats_ms.p95} ms
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Model Scientific Documentation */}
            {modelInfo && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <FileText size={18} color="#a855f7" /> Scientific Model Documentation
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>Model Name:</strong> {modelInfo.metadata.model_name} ({modelInfo.metadata.model_version})
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>Architecture:</strong> {modelInfo.metadata.model_architecture}
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>Corpus & Dataset:</strong> {modelInfo.metadata.dataset}
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>Preprocessing:</strong> {modelInfo.metadata.preprocessing}
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>Inference Pipeline:</strong> {modelInfo.metadata.inference_process}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-secondary)' }}>Classification Taxonomy:</strong> {modelInfo.classes.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: EXPERIMENT CONFIGURATION ================= */}
        {activeTab === 'config' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title">
                  <Layers size={18} color="#6366f1" /> Factorial Experiment Matrix Architecture
                </div>
                <span className="badge badge-purple">3 x 3 x 2 Design</span>
              </div>

              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                The research harness evaluates the factorial combination of <strong>Resource Profiles</strong>, <strong>Request Workload Tiers</strong>, and <strong>Autoscaling Policies</strong> with 3+ repeated trials to guarantee empirical validity.
              </p>

              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                <div className="card" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>1. Resource Profiles</div>
                  <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <li style={{ marginBottom: '0.35rem' }}>• <strong>LOW:</strong> 150m req / 250m lim CPU | 128Mi RAM</li>
                    <li style={{ marginBottom: '0.35rem' }}>• <strong>MEDIUM:</strong> 300m req / 500m lim CPU | 256Mi RAM</li>
                    <li>• <strong>HIGH:</strong> 800m req / 1200m lim CPU | 512Mi RAM</li>
                  </ul>
                </div>

                <div className="card" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>2. Workload Tiers</div>
                  <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <li style={{ marginBottom: '0.35rem' }}>• <strong>LOW:</strong> 10 Users, 2 spawn/s (30s)</li>
                    <li style={{ marginBottom: '0.35rem' }}>• <strong>MEDIUM:</strong> 30 Users, 5 spawn/s (35s)</li>
                    <li>• <strong>HIGH:</strong> 60 Users, 10 spawn/s (40s)</li>
                  </ul>
                </div>

                <div className="card" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>3. Scaling Modes</div>
                  <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <li style={{ marginBottom: '0.35rem' }}>• <strong>FIXED:</strong> Static 1 Pod Replica</li>
                    <li>• <strong>HPA:</strong> Dynamic Autoscaler (1-8 Pods, Target CPU 60%)</li>
                  </ul>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>CLI Command to Execute Benchmark:</div>
                <div className="code-box">
{`# Run full automated factorial benchmark matrix (all profiles x workloads x scaling):
python3 experiments/scripts/run_matrix_benchmark.py --repetitions 3

# Or execute targeted experiment:
python3 experiments/scripts/run_matrix_benchmark.py --profile medium --workload high --scaling hpa`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LIVE METRICS ================= */}
        {activeTab === 'metrics' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title">
                  <Activity size={18} color="#06b6d4" /> Prometheus & Grafana Telemetry Streams
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href="http://localhost:30000"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    Open Grafana (Port 30000)
                  </a>
                  <a
                    href="http://localhost:30090"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    Open Prometheus (Port 30090)
                  </a>
                </div>
              </div>

              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-box">
                  <div className="stat-title">Metrics Scrape Rate</div>
                  <div className="stat-value">2.0 <span style={{ fontSize: '0.8rem' }}>sec</span></div>
                  <div className="stat-tag">Prometheus Configured</div>
                </div>
                <div className="stat-box">
                  <div className="stat-title">Latency Tracking</div>
                  <div className="stat-value">14 <span style={{ fontSize: '0.8rem' }}>Buckets</span></div>
                  <div className="stat-tag">1ms - 10,000ms</div>
                </div>
                <div className="stat-box">
                  <div className="stat-title">HPA Metric Source</div>
                  <div className="stat-value">CPU / Mem</div>
                  <div className="stat-tag">60% CPU / 70% Mem</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Custom Prometheus Exporter (`/metrics`):</div>
                <div className="code-box">
{`# Sample Prometheus exposition from AI Pod:
ai_inference_requests_total{endpoint="predict",predicted_topic="Distributed Systems",status="success"} 142.0
ai_inference_latency_seconds_bucket{endpoint="predict",le="0.05"} 128.0
ai_inference_latency_seconds_sum{endpoint="predict"} 2.45
ai_active_requests 1.0
ai_process_memory_rss_bytes 155828224.0
ai_process_cpu_percent 24.5`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: RESEARCH RESULTS ================= */}
        {activeTab === 'results' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title">
                  <BarChart3 size={18} color="#10b981" /> Empirical Results & Analysis
                </div>
                <button className="btn btn-secondary" onClick={fetchExperimentsData} disabled={loadingExp} style={{ padding: '0.4rem 0.75rem' }}>
                  <RefreshCw size={14} className={loadingExp ? 'spin' : ''} /> Refresh Data
                </button>
              </div>

              {experimentsData && experimentsData.status === "success" && experimentsData.experiments.length > 0 ? (
                <div>
                  <div className="table-wrapper" style={{ marginBottom: '2rem' }}>
                    <table className="research-table">
                      <thead>
                        <tr>
                          <th>Experiment ID</th>
                          <th>Profile</th>
                          <th>Workload</th>
                          <th>Scaling</th>
                          <th>Throughput (req/s)</th>
                          <th>Avg Latency (ms)</th>
                          <th>P95 Latency (ms)</th>
                          <th>Pods</th>
                          <th>Efficiency (RPS/Core)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experimentsData.experiments.map((exp) => (
                          <tr key={exp.experiment_id}>
                            <td style={{ color: 'var(--accent-cyan)' }}>{exp.experiment_id}</td>
                            <td>{exp.configuration.resource_profile?.toUpperCase()}</td>
                            <td>{exp.configuration.workload_profile?.toUpperCase()}</td>
                            <td>
                              <span className={`badge ${exp.configuration.scaling_mode === 'hpa' ? 'badge-purple' : 'badge-info'}`}>
                                {exp.configuration.scaling_mode?.toUpperCase()}
                              </span>
                            </td>
                            <td>{exp.statistical_results.throughput_rps.mean} ± {exp.statistical_results.throughput_rps.std_dev}</td>
                            <td>{exp.statistical_results.average_latency_ms.mean} ± {exp.statistical_results.average_latency_ms.std_dev}</td>
                            <td>{exp.statistical_results.p95_latency_ms.mean}</td>
                            <td>{exp.statistical_results.pod_count.mean}</td>
                            <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                              {exp.statistical_results.resource_efficiency_score}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {experimentsData.graphs && experimentsData.graphs.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>Generated Publication Figures:</div>
                      <div className="grid-2">
                        {experimentsData.graphs.map((g) => (
                          <div key={g} className="card" style={{ background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>{g}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                              experiments/graphs/{g}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="notice-box">
                  <Database size={36} className="notice-icon" />
                  <div className="notice-title">Experimental data not available.</div>
                  <div className="notice-desc">
                    No experiments have been executed yet. Run the benchmark runner script to conduct controlled factorial trials and generate empirical data.
                  </div>
                  <div className="code-box" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
python3 experiments/scripts/run_matrix_benchmark.py --repetitions 3
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>Optimizing AI Workloads in Kubernetes-Based Environments • University Research Project</div>
      </footer>
    </div>
  );
}
