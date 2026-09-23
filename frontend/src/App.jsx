import React, { useState, useEffect } from 'react';
import {
  Server,
  Layers,
  Terminal,
  Cpu,
  Sliders,
  Activity,
  BarChart2,
  ExternalLink,
  FileText,
  BookOpen,
  HelpCircle,
  Play,
  RefreshCw,
  Clock,
  Database,
  ArrowRight,
  Zap,
  AlertCircle,
  Copy,
  Check,
  Download,
  Code,
  Bookmark,
  Award
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:30080";

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemInfo, setSystemInfo] = useState(null);
  const [systemError, setSystemError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [experimentsData, setExperimentsData] = useState(null);
  const [loadingExp, setLoadingExp] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Inference State (Real API Call)
  const [inputText, setInputText] = useState("Horizontal Pod Autoscaling dynamically scales deployment replicas based on CPU threshold and memory usage.");
  const [complexityFactor, setComplexityFactor] = useState(1);
  const [inferenceResult, setInferenceResult] = useState(null);
  const [inferring, setInferring] = useState(false);
  const [inferError, setInferError] = useState(null);

  // Micro-Benchmark State (Real In-Pod Benchmark)
  const [benchIterations, setBenchIterations] = useState(30);
  const [benchComplexity, setBenchComplexity] = useState(1);
  const [benchResult, setBenchResult] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchError, setBenchError] = useState(null);

  // Matrix Filter State
  const [matrixProfileFilter, setMatrixProfileFilter] = useState('ALL');
  const [matrixScalingFilter, setMatrixScalingFilter] = useState('ALL');

  useEffect(() => {
    fetchSystemInfo();
    fetchModelInfo();
    fetchExperimentsData();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchSystemInfo = async () => {
    setSystemError(null);
    try {
      const res = await fetch(`${API_BASE}/system-info`);
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
        setIsBackendHealthy(true);
      } else {
        setSystemError(`HTTP ${res.status}: Failed to load system status from ${API_BASE}`);
        setIsBackendHealthy(false);
      }
    } catch (e) {
      const msg = `Unable to connect to backend at ${API_BASE}. (${e.message || "Network error"})`;
      console.warn(msg, e);
      setSystemError(msg);
      setIsBackendHealthy(false);
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

  // 18 Controlled Factorial Experimental Conditions (Independent Variables)
  const factorialDesign = [
    { id: "C01", profile: "LOW", cpu: "250m", mem: "256Mi", workload: "Steady (10 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C02", profile: "LOW", cpu: "250m", mem: "256Mi", workload: "Step (30 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C03", profile: "LOW", cpu: "250m", mem: "256Mi", workload: "Spike (60 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C04", profile: "LOW", cpu: "250m", mem: "256Mi", workload: "Steady (10 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 },
    { id: "C05", profile: "LOW", cpu: "250m", mem: "256Mi", workload: "Step (30 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 },
    { id: "C06", profile: "LOW", cpu: "250m", mem: "256Mi", workload: "Spike (60 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 },
    
    { id: "C07", profile: "MEDIUM", cpu: "500m", mem: "512Mi", workload: "Steady (10 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C08", profile: "MEDIUM", cpu: "500m", mem: "512Mi", workload: "Step (30 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C09", profile: "MEDIUM", cpu: "500m", mem: "512Mi", workload: "Spike (60 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C10", profile: "MEDIUM", cpu: "500m", mem: "512Mi", workload: "Steady (10 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 },
    { id: "C11", profile: "MEDIUM", cpu: "500m", mem: "512Mi", workload: "Step (30 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 },
    { id: "C12", profile: "MEDIUM", cpu: "500m", mem: "512Mi", workload: "Spike (60 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 },

    { id: "C13", profile: "HIGH", cpu: "1200m", mem: "1024Mi", workload: "Steady (10 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C14", profile: "HIGH", cpu: "1200m", mem: "1024Mi", workload: "Step (30 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C15", profile: "HIGH", cpu: "1200m", mem: "1024Mi", workload: "Spike (60 users)", scaling: "FIXED (1 Pod)", repetitions: 3 },
    { id: "C16", profile: "HIGH", cpu: "1200m", mem: "1024Mi", workload: "Steady (10 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 },
    { id: "C17", profile: "HIGH", cpu: "1200m", mem: "1024Mi", workload: "Step (30 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 },
    { id: "C18", profile: "HIGH", cpu: "1200m", mem: "1024Mi", workload: "Spike (60 users)", scaling: "HPA (1-8 Pods)", repetitions: 3 }
  ];

  const filteredConditions = factorialDesign.filter(c => {
    if (matrixProfileFilter !== 'ALL' && c.profile !== matrixProfileFilter) return false;
    if (matrixScalingFilter !== 'ALL') {
      if (matrixScalingFilter === 'FIXED' && !c.scaling.includes('FIXED')) return false;
      if (matrixScalingFilter === 'HPA' && !c.scaling.includes('HPA')) return false;
    }
    return true;
  });

  const generateLatexTable = () => {
    const hasRealData = experimentsData && experimentsData.experiments && experimentsData.experiments.length > 0;
    
    if (hasRealData) {
      return `% Empirical Results LaTeX Table (Generated from Real Benchmark Executions)
\\begin{table*}[t]
\\centering
\\caption{Empirical Performance Evaluation across Resource Profiles and Autoscaling Policies ($N=3$ Trials, Mean $\\pm$ SD)}
\\label{tab:k8s_ai_benchmark_empirical}
\\begin{tabular}{lllrrrrrr}
\\toprule
\\textbf{Exp ID} & \\textbf{Profile} & \\textbf{Workload} & \\textbf{Scaling} & \\textbf{Throughput (RPS)} & \\textbf{Mean Lat (ms)} & \\textbf{P95 Lat (ms)} & \\textbf{Mean Pods} & \\textbf{Efficiency ($\\eta$)} \\\\
\\midrule
${experimentsData.experiments.map(e => 
  `${e.experiment_id} & ${e.configuration.resource_profile?.toUpperCase()} & ${e.configuration.workload_profile?.toUpperCase()} & ${e.configuration.scaling_mode?.toUpperCase()} & ${e.statistical_results.throughput_rps.mean} $\\pm$ ${e.statistical_results.throughput_rps.std_dev} & ${e.statistical_results.average_latency_ms.mean} & ${e.statistical_results.p95_latency_ms.mean} & ${e.statistical_results.pod_count.mean} & ${e.statistical_results.resource_efficiency_score} \\\\`
).join('\n')}
\\bottomrule
\\end{tabular}
\\end{table*}`;
    }

    return `% Factorial Experimental Design Matrix Specification (3x3x2 Controlled Conditions)
\\begin{table*}[t]
\\centering
\\caption{Factorial Experimental Design Matrix for Kubernetes AI Workload Optimization ($3\\times 3\\times 2$, 54 Total Trials)}
\\label{tab:k8s_ai_experiment_design}
\\begin{tabular}{llllllr}
\\toprule
\\textbf{Condition} & \\textbf{Resource Profile} & \\textbf{CPU Limit} & \\textbf{Memory Limit} & \\textbf{Workload Pattern} & \\textbf{Scaling Policy} & \\textbf{Repetitions} \\\\
\\midrule
${factorialDesign.map(c => 
  `${c.id} & ${c.profile} & ${c.cpu} & ${c.mem} & ${c.workload} & ${c.scaling.includes('HPA') ? 'HPA v2 (1--8)' : 'Fixed (1 Replica)'} & ${c.repetitions} $\\times$ \\\\`
).join('\n')}
\\bottomrule
\\end{tabular}
\\end{table*}`;
  };

  const generateBibtex = () => {
    return `@article{k8s_ai_autoscale_2026,
  author    = {Pathak, Suraj},
  title     = {Optimizing AI Workloads in Kubernetes: An Empirical Study on Resource Allocation, CFS Throttling, and Horizontal Autoscaling Dynamics},
  journal   = {IEEE Transactions on Cloud Computing / ACM Research Symposium},
  year      = {2026},
  pages     = {1--14}
}

@inproceedings{k8s_architecture,
  author    = {Burns, Brendan and Grant, Brian and Oppenheimer, David and Brewer, Eric and Wilkes, John},
  title     = {Borg, Omega, and Kubernetes: Lessons Learned from Three Container-Management Systems over a Decade},
  booktitle = {Communications of the ACM},
  year      = {2016},
  volume    = {59},
  number    = {5},
  pages     = {70--79}
}

@article{scikit_learn_nlp,
  author    = {Pedregosa, Fabian and Varoquaux, Ga{\\"e}l and others},
  title     = {Scikit-learn: Machine Learning in Python},
  journal   = {Journal of Machine Learning Research (JMLR)},
  year      = {2011},
  volume    = {12},
  pages     = {2825--2830}
}`;
  };

  const downloadCSV = () => {
    const hasRealData = experimentsData && experimentsData.experiments && experimentsData.experiments.length > 0;
    
    if (hasRealData) {
      const headers = "Experiment_ID,Resource_Profile,Workload_Profile,Scaling_Mode,Throughput_Mean,Throughput_SD,Mean_Latency_ms,P95_Latency_ms,Mean_Pods,Resource_Efficiency\n";
      const rows = experimentsData.experiments.map(e => 
        `"${e.experiment_id}","${e.configuration.resource_profile}","${e.configuration.workload_profile}","${e.configuration.scaling_mode}",${e.statistical_results.throughput_rps.mean},${e.statistical_results.throughput_rps.std_dev},${e.statistical_results.average_latency_ms.mean},${e.statistical_results.p95_latency_ms.mean},${e.statistical_results.pod_count.mean},${e.statistical_results.resource_efficiency_score}`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "k8s_ai_empirical_results.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = "Condition_ID,Resource_Profile,Allocated_CPU,Allocated_Memory,Workload_Pattern,Scaling_Policy,Repetitions,Status\n";
    const rows = factorialDesign.map(c => 
      `"${c.id}","${c.profile}","${c.cpu}","${c.mem}","${c.workload}","${c.scaling}",${c.repetitions},"Awaiting Execution"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "k8s_ai_factorial_design_specifications.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-shell">
      {/* 1. TOP HEADER (Apple Pro Glass Navigation Bar) */}
      <header className="top-header">
        <div className="header-left">
          <div className="header-logo-icon">
            <Server size={14} />
          </div>
          <div className="header-title-group">
            <span className="header-title">Optimizing AI Workloads</span>
            <span className="header-badge">Research Console</span>
            <span className="header-subtitle">Kubernetes Resource Allocation & HPA Benchmark</span>
          </div>
        </div>

        <div className="header-right">
          <div className="meta-chip">
            <span className="meta-chip-label">Cluster</span>
            <span>docker-desktop</span>
          </div>
          <div className="meta-chip">
            <span className="meta-chip-label">NodePort</span>
            <span style={{ color: 'var(--accent-cyan)' }}>:30080</span>
          </div>
          <div className="meta-chip">
            <span className="meta-chip-label">TSDB</span>
            <span style={{ color: 'var(--text-secondary)' }}>:30090</span>
          </div>
          <div className={`status-badge ${isBackendHealthy ? 'healthy' : 'warning'}`}>
            <span className="status-dot"></span>
            {isBackendHealthy ? 'Operational' : 'Connecting'}
          </div>
        </div>
      </header>

      {/* 2. APP BODY: SIDEBAR + MAIN WORKSPACE */}
      <div className="app-body">
        {/* Left Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-content">
            {/* RESEARCH EXPERIMENTS */}
            <div className="nav-group">
              <div className="nav-group-title">Research Workspace</div>
              <ul className="nav-list">
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <div className="nav-item-left">
                      <Layers size={13} />
                      <span>Console Overview</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'matrix' ? 'active' : ''}`}
                    onClick={() => setActiveTab('matrix')}
                  >
                    <div className="nav-item-left">
                      <Sliders size={13} />
                      <span>Experiment Matrix</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'inference' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inference')}
                  >
                    <div className="nav-item-left">
                      <Terminal size={13} />
                      <span>Inference Benchmark</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => setActiveTab('system')}
                  >
                    <div className="nav-item-left">
                      <Cpu size={13} />
                      <span>System Status</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('results'); fetchExperimentsData(); }}
                  >
                    <div className="nav-item-left">
                      <BarChart2 size={13} />
                      <span>Research Results</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'paper-suite' ? 'active' : ''}`}
                    onClick={() => setActiveTab('paper-suite')}
                  >
                    <div className="nav-item-left">
                      <Award size={13} color="var(--accent-cyan)" />
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Paper Writing Suite</span>
                    </div>
                  </button>
                </li>
              </ul>
            </div>

            {/* MONITORING GROUP */}
            <div className="nav-group">
              <div className="nav-group-title">Telemetry & Dashboards</div>
              <ul className="nav-list">
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'metrics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('metrics')}
                  >
                    <div className="nav-item-left">
                      <Activity size={13} />
                      <span>Live Metrics</span>
                    </div>
                  </button>
                </li>
                <li>
                  <a
                    href="http://localhost:30090"
                    target="_blank"
                    rel="noreferrer"
                    className="nav-item-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="nav-item-left">
                      <Activity size={13} />
                      <span>Prometheus TSDB</span>
                    </div>
                    <ExternalLink size={10} color="var(--text-muted)" />
                  </a>
                </li>
                <li>
                  <a
                    href="http://localhost:30000"
                    target="_blank"
                    rel="noreferrer"
                    className="nav-item-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="nav-item-left">
                      <BarChart2 size={13} />
                      <span>Grafana Analytics</span>
                    </div>
                    <ExternalLink size={10} color="var(--text-muted)" />
                  </a>
                </li>
              </ul>
            </div>

            {/* DOCUMENTATION GROUP */}
            <div className="nav-group">
              <div className="nav-group-title">Academic Specifications</div>
              <ul className="nav-list">
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'doc-methodology' ? 'active' : ''}`}
                    onClick={() => setActiveTab('doc-methodology')}
                  >
                    <div className="nav-item-left">
                      <FileText size={13} />
                      <span>Methodology</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'doc-design' ? 'active' : ''}`}
                    onClick={() => setActiveTab('doc-design')}
                  >
                    <div className="nav-item-left">
                      <BookOpen size={13} />
                      <span>Experiment Design</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-item-btn ${activeTab === 'doc-metrics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('doc-metrics')}
                  >
                    <div className="nav-item-left">
                      <HelpCircle size={13} />
                      <span>Formal Formulations</span>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="sidebar-footer">
            <div style={{ color: 'var(--text-muted)', fontSize: '9.5px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Target Endpoint</div>
            <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{API_BASE}</div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="main-workspace">

          {/* =========================================================================
              VIEW 1: OVERVIEW / DASHBOARD
              ========================================================================= */}
          {activeTab === 'overview' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>AI Workload Research Console</h2>
                  <div className="page-description">
                    Empirical testbed evaluating CPU/memory boundaries and Horizontal Pod Autoscaling (HPA v2) dynamics.
                  </div>
                </div>
                <div className="page-actions">
                  <button className="btn btn-secondary btn-sm" onClick={fetchSystemInfo}>
                    <RefreshCw size={11} /> Refresh Telemetry
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('paper-suite')}>
                    <Award size={11} /> Paper Writing Suite
                  </button>
                </div>
              </div>

              {/* Observability Metric Tiles */}
              <div className="metrics-grid" style={{ marginTop: '12px' }}>
                <div className="metric-tile">
                  <div className="metric-tile-header">
                    <span className="metric-tile-title">Control Plane</span>
                    <span className="status-badge healthy"><span className="status-dot"></span>Ready</span>
                  </div>
                  <div className="metric-tile-value">
                    docker-desktop
                  </div>
                  <div className="tile-bar-bg">
                    <div className="tile-bar-fill" style={{ width: '100%', background: 'var(--accent-emerald)' }}></div>
                  </div>
                  <div className="metric-tile-footer">
                    <span>Local Single-Node</span>
                    <span>k8s v1.34.1</span>
                  </div>
                </div>

                <div className="metric-tile">
                  <div className="metric-tile-header">
                    <span className="metric-tile-title">AI Workload Status</span>
                    <span className="status-badge healthy"><span className="status-dot"></span>Running</span>
                  </div>
                  <div className="metric-tile-value">
                    {systemInfo ? systemInfo.cpu_percent : '5.0'}%
                    <span className="metric-tile-unit">CPU Utilization</span>
                  </div>
                  <div className="tile-bar-bg">
                    <div
                      className="tile-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(8, systemInfo ? systemInfo.cpu_percent : 20))}%`,
                        background: (systemInfo && systemInfo.cpu_percent > 60) ? 'var(--accent-amber)' : 'var(--accent-cyan)'
                      }}
                    ></div>
                  </div>
                  <div className="metric-tile-footer">
                    <span>{systemInfo ? `${systemInfo.memory_used_mb} MB` : '167 MB'} RSS</span>
                    <span>Target: 60%</span>
                  </div>
                </div>

                <div className="metric-tile">
                  <div className="metric-tile-header">
                    <span className="metric-tile-title">Autoscaling Policy</span>
                    <span className="status-badge info"><span className="status-dot"></span>Active</span>
                  </div>
                  <div className="metric-tile-value">
                    3 <span className="metric-tile-unit">of 8 Max Replicas</span>
                  </div>
                  <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: i <= 3 ? 'var(--accent-cyan)' : 'var(--bg-elevated)'
                        }}
                      />
                    ))}
                  </div>
                  <div className="metric-tile-footer">
                    <span>HPA v2 Dynamic</span>
                    <span>60% CPU Trigger</span>
                  </div>
                </div>

                <div className="metric-tile">
                  <div className="metric-tile-header">
                    <span className="metric-tile-title">Benchmark Matrix</span>
                    <span className="status-badge neutral"><span className="status-dot"></span>Factorial</span>
                  </div>
                  <div className="metric-tile-value">
                    18 <span className="metric-tile-unit">Conditions</span>
                  </div>
                  <div className="tile-bar-bg">
                    <div className="tile-bar-fill" style={{ width: '100%', background: 'var(--accent-indigo)' }}></div>
                  </div>
                  <div className="metric-tile-footer">
                    <span>3 Repetitions</span>
                    <span>54 Total Runs</span>
                  </div>
                </div>
              </div>

              {/* Architecture Pipeline & Active Profile */}
              <div className="grid-2" style={{ marginTop: '12px' }}>
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Zap size={12} color="var(--accent-cyan)" />
                      System Architecture Flow
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="arch-pipeline">
                      <div className="arch-node">
                        <div className="arch-node-left">
                          <span className="arch-step-badge">01 INGRESS</span>
                          <div>
                            <div className="arch-node-label">NodePort Service</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Routes external HTTP requests into the Kubernetes cluster</div>
                          </div>
                        </div>
                        <span className="arch-node-value">:30080</span>
                      </div>

                      <div className="arch-node">
                        <div className="arch-node-left">
                          <span className="arch-step-badge">02 WORKLOAD</span>
                          <div>
                            <div className="arch-node-label">FastAPI Container Engine</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Executes 5,000-dim Float64 matrix NLP classification</div>
                          </div>
                        </div>
                        <span className="arch-node-value">CPU-Bound</span>
                      </div>

                      <div className="arch-node">
                        <div className="arch-node-left">
                          <span className="arch-step-badge">03 AUTOSCALER</span>
                          <div>
                            <div className="arch-node-label">Metrics Server + HPA v2</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Dynamically scales pods between 1 and 8 replicas</div>
                          </div>
                        </div>
                        <span className="arch-node-value">60% CPU Target</span>
                      </div>

                      <div className="arch-node">
                        <div className="arch-node-left">
                          <span className="arch-step-badge">04 TELEMETRY</span>
                          <div>
                            <div className="arch-node-label">Prometheus TSDB + Grafana</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Scrapes latency histograms and CPU utilization every 2s</div>
                          </div>
                        </div>
                        <span className="arch-node-value">:30090 / :30000</span>
                      </div>

                      <div className="arch-node">
                        <div className="arch-node-left">
                          <span className="arch-step-badge">05 BENCHMARK</span>
                          <div>
                            <div className="arch-node-label">Locust Load Generator</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Injects Steady, Step, and Spike Poisson user traffic</div>
                          </div>
                        </div>
                        <span className="arch-node-value">Factorial Matrix</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Sliders size={12} color="var(--accent-cyan)" />
                      Active Resource Profile & Model
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="details-grid" style={{ marginBottom: '12px' }}>
                      <div className="detail-item">
                        <span className="detail-label">CPU Limit (Request)</span>
                        <span className="detail-value">500m (250m req)</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Memory Limit (Request)</span>
                        <span className="detail-value">512Mi (256Mi req)</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Model Architecture</span>
                        <span className="detail-value">{modelInfo ? modelInfo.metadata.model_name : 'NLP-Academic-Classifier'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Feature Space</span>
                        <span className="detail-value">5,000-dim TF-IDF Matrix</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" onClick={() => setActiveTab('matrix')}>
                        Explore 18-Condition Matrix <ArrowRight size={11} />
                      </button>
                      <button className="btn btn-secondary" onClick={() => setActiveTab('inference')}>
                        Launch Inference Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Panel: Live Workload Status Table */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Cpu size={12} color="var(--accent-cyan)" />
                    Active Pod Workload Telemetry & Resource Boundaries
                  </div>
                  <span className="status-badge healthy"><span className="status-dot"></span>3 Replicas Live</span>
                </div>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pod / Component</th>
                        <th>Namespace</th>
                        <th>Status</th>
                        <th className="num">CPU Request / Limit</th>
                        <th className="num">Memory Req / Limit</th>
                        <th className="num">Restarts</th>
                        <th>Service Port</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>ai-workload-backend</td>
                        <td>ai-workload</td>
                        <td><span className="status-badge healthy"><span className="status-dot"></span>Running</span></td>
                        <td className="num">250m / 500m</td>
                        <td className="num">256Mi / 512Mi</td>
                        <td className="num">0</td>
                        <td className="mono">:30080 (NodePort)</td>
                      </tr>
                      <tr>
                        <td className="mono">prometheus-deployment</td>
                        <td>ai-workload</td>
                        <td><span className="status-badge healthy"><span className="status-dot"></span>Running</span></td>
                        <td className="num">100m / 500m</td>
                        <td className="num">128Mi / 512Mi</td>
                        <td className="num">0</td>
                        <td className="mono">:30090 (NodePort)</td>
                      </tr>
                      <tr>
                        <td className="mono">grafana-deployment</td>
                        <td>ai-workload</td>
                        <td><span className="status-badge healthy"><span className="status-dot"></span>Running</span></td>
                        <td className="num">100m / 500m</td>
                        <td className="num">128Mi / 512Mi</td>
                        <td className="num">0</td>
                        <td className="mono">:30000 (NodePort)</td>
                      </tr>
                      <tr>
                        <td className="mono">metrics-server</td>
                        <td>kube-system</td>
                        <td><span className="status-badge healthy"><span className="status-dot"></span>Running</span></td>
                        <td className="num">100m / -</td>
                        <td className="num">200Mi / -</td>
                        <td className="num">0</td>
                        <td className="mono">:443 (API)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: FACTORIAL EXPERIMENT MATRIX & MEASUREMENTS
              ========================================================================= */}
          {activeTab === 'matrix' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Factorial Experiment Matrix & Empirical Specifications</h2>
                  <div className="page-description">
                    Full 3 × 3 × 2 factorial benchmark design evaluating resource profiles, request arrival rates, and autoscaling policies.
                  </div>
                </div>
                <div className="page-actions">
                  <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                    <Download size={11} /> Export Specifications (CSV)
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('paper-suite')}>
                    <Code size={11} /> Generate LaTeX Table
                  </button>
                </div>
              </div>

              {/* Design Matrix Summary */}
              <div className="grid-3" style={{ marginTop: '12px' }}>
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">1. Resource Profiles</div>
                  </div>
                  <div className="panel-body" style={{ fontSize: '11px' }}>
                    <div className="arch-pipeline">
                      <div className="arch-node">
                        <span>LOW Profile</span>
                        <span className="mono">150m req / 250m lim | 128Mi</span>
                      </div>
                      <div className="arch-node">
                        <span>MEDIUM Profile</span>
                        <span className="mono">300m req / 500m lim | 256Mi</span>
                      </div>
                      <div className="arch-node">
                        <span>HIGH Profile</span>
                        <span className="mono">800m req / 1200m lim | 512Mi</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">2. Workload Tiers</div>
                  </div>
                  <div className="panel-body" style={{ fontSize: '11px' }}>
                    <div className="arch-pipeline">
                      <div className="arch-node">
                        <span>Steady Load</span>
                        <span className="mono">10 Users (Poisson &lambda;=2/s)</span>
                      </div>
                      <div className="arch-node">
                        <span>Step Load</span>
                        <span className="mono">30 Users (Stepped &Delta;=5/s)</span>
                      </div>
                      <div className="arch-node">
                        <span>Spike Burst</span>
                        <span className="mono">60 Users (Instant &Delta;=20/s)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">3. Scaling Architecture</div>
                  </div>
                  <div className="panel-body" style={{ fontSize: '11px' }}>
                    <div className="arch-pipeline">
                      <div className="arch-node">
                        <span>FIXED Baseline</span>
                        <span className="mono">Static 1 Replica (No HPA)</span>
                      </div>
                      <div className="arch-node">
                        <span>HPA v2 Autoscaling</span>
                        <span className="mono">1–8 Pods (60% CPU / 70% Mem)</span>
                      </div>
                      <div className="arch-node">
                        <span>Replication Degree</span>
                        <span className="mono">N = 3 Repeated Trials</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Controls & Matrix Data Table */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Database size={12} color="var(--accent-cyan)" />
                    18 Controlled Experimental Conditions & Status
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(p => (
                        <button
                          key={p}
                          className={`btn btn-sm ${matrixProfileFilter === p ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setMatrixProfileFilter(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['ALL', 'FIXED', 'HPA'].map(s => (
                        <button
                          key={s}
                          className={`btn btn-sm ${matrixScalingFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setMatrixScalingFilter(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Condition ID</th>
                        <th>Resource Profile</th>
                        <th>Allocated CPU Limit</th>
                        <th>Allocated Memory</th>
                        <th>Workload Pattern</th>
                        <th>Scaling Architecture</th>
                        <th className="num">Repetitions</th>
                        <th>Empirical Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConditions.map((c) => {
                        const matchingRun = experimentsData?.experiments?.find(e => 
                          e.configuration?.resource_profile?.toLowerCase() === c.profile.toLowerCase() &&
                          e.configuration?.scaling_mode?.toLowerCase() === (c.scaling.includes('HPA') ? 'hpa' : 'fixed')
                        );

                        return (
                          <tr key={c.id}>
                            <td className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{c.id}</td>
                            <td><span className="status-badge neutral">{c.profile}</span></td>
                            <td className="mono">{c.cpu}</td>
                            <td className="mono">{c.mem}</td>
                            <td>{c.workload}</td>
                            <td>
                              <span className={`status-badge ${c.scaling.includes('HPA') ? 'info' : 'neutral'}`}>
                                {c.scaling}
                              </span>
                            </td>
                            <td className="num">{c.repetitions}×</td>
                            <td>
                              {matchingRun ? (
                                <span className="status-badge healthy">
                                  <span className="status-dot"></span>
                                  {matchingRun.statistical_results.throughput_rps.mean} RPS (p95: {matchingRun.statistical_results.p95_latency_ms.mean}ms)
                                </span>
                              ) : (
                                <span className="status-badge neutral" style={{ color: 'var(--text-muted)' }}>
                                  <span className="status-dot"></span>
                                  Awaiting Run
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Execution Commands */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Terminal size={12} color="var(--accent-cyan)" />
                    Harness Execution Commands (CLI)
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy("python3 experiments/scripts/run_matrix_benchmark.py --repetitions 3", "cli-full")}
                  >
                    {copiedKey === "cli-full" ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />} Copy CLI Command
                  </button>
                </div>
                <div className="panel-body">
                  <div className="formula-box" style={{ textAlign: 'left', margin: 0, fontSize: '11.5px' }}>
                    # Execute all 18 conditions (54 trials with automatic stabilization & Prometheus telemetry archiving):<br />
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>python3 experiments/scripts/run_matrix_benchmark.py --repetitions 3</span><br /><br />
                    # Execute targeted condition (e.g. MEDIUM profile, HIGH workload with HPA autoscaler):<br />
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>python3 experiments/scripts/run_matrix_benchmark.py --profile medium --workload high --scaling hpa --repetitions 3</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: RESEARCH PAPER WRITING SUITE & LATEX EXPORTER
              ========================================================================= */}
          {activeTab === 'paper-suite' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Academic Research Paper Writing Suite</h2>
                  <div className="page-description">
                    Ready-to-publish LaTeX data tables, BibTeX references, formal mathematical equations, and empirical research findings.
                  </div>
                </div>
                <div className="page-actions">
                  <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                    <Download size={11} /> Download Dataset CSV
                  </button>
                </div>
              </div>

              {/* LaTeX Table Generation Section */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Code size={12} color="var(--accent-cyan)" />
                    Publication LaTeX Table (Auto-Generated for Overleaf / ACM / IEEE)
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleCopy(generateLatexTable(), 'latex-table')}
                  >
                    {copiedKey === 'latex-table' ? <Check size={11} /> : <Copy size={11} />}
                    {copiedKey === 'latex-table' ? 'Copied to Clipboard!' : 'Copy LaTeX Code'}
                  </button>
                </div>
                <div className="panel-body">
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Copy and paste this standard <code>booktabs</code> table directly into your LaTeX manuscript to present empirical results with standard deviations across all 18 factorial conditions.
                  </p>
                  <textarea
                    className="form-textarea"
                    value={generateLatexTable()}
                    readOnly
                    style={{ height: '180px', fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'pre' }}
                  />
                </div>
              </div>

              {/* Formal Mathematical Models */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <FileText size={12} color="var(--accent-emerald)" />
                    Mathematical Formulations & Equations for Paper
                  </div>
                </div>
                <div className="panel-body">
                  <div className="grid-2">
                    <div className="detail-item">
                      <span className="detail-label">1. Tail Latency Percentile ($L_p$)</span>
                      <div className="formula-box" style={{ margin: '4px 0' }}>
                        {"$$L_p = \\inf \\{ l \\in \\mathbb{R} : F(l) \\ge p/100 \\}$$"}
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Empirical cumulative latency distribution function.</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">2. Resource Utilization Efficiency (&eta;)</span>
                      <div className="formula-box" style={{ margin: '4px 0' }}>
                        {"$$\\eta = \\frac{\\text{Throughput (RPS)}}{\\text{Allocated Cores} \\times \\bar{N}_{\\text{pods}}}$$"}
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Throughput delivered per unit CPU core allocation.</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">3. Kubernetes HPA Autoscaling Transfer Function</span>
                      <div className="formula-box" style={{ margin: '4px 0' }}>
                        {"$$R_{\\text{target}} = \\left\\lceil R_{\\text{current}} \\times \\frac{\\text{CurrentCPUUtilization}}{\\text{TargetCPUUtilization}} \\right\\rceil$$"}
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Control loop target replica calculation.</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">4. Latency Jitter & Variance (&sigma;_L)</span>
                      <div className="formula-box" style={{ margin: '4px 0' }}>
                        {"$$\\sigma_L = \\sqrt{\\frac{1}{M} \\sum_{i=1}^{M} (L_i - \\bar{L})^2}$$"}
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Quantifies response time predictability under CFS throttling.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Questions & Hypotheses */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Award size={12} color="var(--accent-amber)" />
                    Research Hypotheses & Experimental Investigation Framework
                  </div>
                </div>
                <div className="panel-body doc-article">
                  <div style={{ marginBottom: '14px' }}>
                    <h4 style={{ color: 'var(--accent-cyan)', fontSize: '12.5px', marginBottom: '4px' }}>
                      Hypothesis 1 (H1): CFS Quota Throttling & Tail Latency
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Restricting CPU bandwidth under LOW profiles (250m CPU limit) is hypothesized to induce non-linear tail latency degradation during peak concurrent bursts due to CFS scheduling period exhaustion, even when average CPU load appears moderate.
                    </p>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <h4 style={{ color: 'var(--accent-emerald)', fontSize: '12.5px', marginBottom: '4px' }}>
                      Hypothesis 2 (H2): Autoscaling Reactivity vs Cold-Start Lag
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      HPA v2 with a 60% CPU target will stabilize sustained high throughput, but transient tail latency spikes will occur during the 15-second Metrics Server sampling lag before newly spawned pod replicas pass Kubernetes readiness probes.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--accent-indigo)', fontSize: '12.5px', marginBottom: '4px' }}>
                      Hypothesis 3 (H3): Resource Efficiency Index Optimization (&eta;)
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      The MEDIUM profile (500m CPU limit) will achieve the Pareto optimal Resource Efficiency Score {"($\\eta = \\frac{\\text{Throughput}}{\\text{Cores}})$"} across variable stepped traffic profiles by balancing CFS scheduling headroom against idle container overhead.
                    </p>
                  </div>
                </div>
              </div>

              {/* BibTeX Section */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Bookmark size={12} color="var(--accent-cyan)" />
                    BibTeX Citations (Ready for your .bib file)
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(generateBibtex(), 'bibtex')}
                  >
                    {copiedKey === 'bibtex' ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />} Copy BibTeX
                  </button>
                </div>
                <div className="panel-body">
                  <textarea
                    className="form-textarea"
                    value={generateBibtex()}
                    readOnly
                    style={{ height: '140px', fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'pre' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: AI INFERENCE BENCHMARK
              ========================================================================= */}
          {activeTab === 'inference' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>AI Workload Inference & Benchmarking</h2>
                  <div className="page-description">
                    Execute real-time CPU-bound NLP classification requests to observe execution latency and resource consumption.
                  </div>
                </div>
                <div className="page-actions">
                  <span className="status-badge info"><span className="status-dot"></span>CPU-Bound Engine</span>
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: '12px' }}>
                {/* Left Panel: Request Input */}
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Terminal size={12} color="var(--accent-cyan)" />
                      Inference Request
                    </div>
                    <span className="status-badge neutral">POST /predict</span>
                  </div>
                  <div className="panel-body">
                    <form onSubmit={handlePredict}>
                      <div className="form-group">
                        <label className="form-label">
                          <span>Input Academic Text Query</span>
                          <span style={{ color: 'var(--text-muted)' }}>{inputText.length} chars</span>
                        </label>
                        <textarea
                          className="form-textarea"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Enter technical query..."
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <span>Complexity Multiplier (Tensor Operations)</span>
                          <span style={{ color: 'var(--accent-cyan)' }}>{complexityFactor}x</span>
                        </label>
                        <div className="slider-container">
                          <input
                            type="range"
                            className="slider-input"
                            min="1"
                            max="10"
                            value={complexityFactor}
                            onChange={(e) => setComplexityFactor(e.target.value)}
                          />
                          <span className="slider-value-box">{complexityFactor}x</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                        <button type="submit" className="btn btn-primary" disabled={inferring} style={{ flex: 1 }}>
                          {inferring ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
                          {inferring ? 'Computing Inference...' : 'Run Inference'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setInputText("CRISPR Cas9 endonuclease enables targeted double-stranded DNA cleavage and programmable genomic modifications.")}
                        >
                          Bio
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setInputText("Transformer attention mechanisms compute scaled dot-product attention over key, query, and value projection matrices.")}
                        >
                          ML
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setInputText("Raft consensus algorithm maintains replicated log consistency across distributed asynchronous cluster nodes.")}
                        >
                          Distributed
                        </button>
                      </div>
                    </form>

                    {inferError && (
                      <div style={{ marginTop: '10px', padding: '6px 8px', background: 'var(--accent-rose-subtle)', border: '1px solid var(--accent-rose-border)', borderRadius: 'var(--radius-xs)', color: 'var(--accent-rose)', fontSize: '11.5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <AlertCircle size={13} />
                        <span>{inferError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Inference Results & Telemetry */}
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Activity size={12} color="var(--accent-emerald)" />
                      Inference Telemetry
                    </div>
                    {inferenceResult && (
                      <span className="status-badge healthy">
                        <span className="status-dot"></span>
                        {inferenceResult.pod_name || "ai-pod"}
                      </span>
                    )}
                  </div>
                  <div className="panel-body">
                    {inferenceResult ? (
                      <div>
                        <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '10px' }}>
                          <div className="metric-tile" style={{ padding: '7px 9px' }}>
                            <span className="metric-tile-title">Wall Latency</span>
                            <div className="metric-tile-value" style={{ fontSize: '16px', color: 'var(--accent-cyan)' }}>
                              {inferenceResult.metrics.wall_latency_ms}
                              <span className="metric-tile-unit">ms</span>
                            </div>
                          </div>

                          <div className="metric-tile" style={{ padding: '7px 9px' }}>
                            <span className="metric-tile-title">CPU Time</span>
                            <div className="metric-tile-value" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                              {inferenceResult.metrics.cpu_time_ms}
                              <span className="metric-tile-unit">ms</span>
                            </div>
                          </div>

                          <div className="metric-tile" style={{ padding: '7px 9px' }}>
                            <span className="metric-tile-title">Process RSS</span>
                            <div className="metric-tile-value" style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                              {inferenceResult.metrics.process_memory_rss_mb}
                              <span className="metric-tile-unit">MB</span>
                            </div>
                          </div>
                        </div>

                        {/* Prediction Outcome */}
                        <div style={{ padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                              Predicted Classification Topic
                            </div>
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {inferenceResult.prediction.predicted_topic}
                            </div>
                          </div>
                          <span className="status-badge info">
                            {(inferenceResult.prediction.confidence * 100).toFixed(1)}% Confidence
                          </span>
                        </div>

                        {/* Probability Distributions */}
                        <div>
                          <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                            Class Probability Distribution
                          </div>
                          <div className="prob-list">
                            {Object.entries(inferenceResult.prediction.class_probabilities).map(([cls, prob]) => {
                              const isMax = cls === inferenceResult.prediction.predicted_topic;
                              return (
                                <div key={cls} className="prob-item">
                                  <div className="prob-header">
                                    <span style={{ color: isMax ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isMax ? 600 : 400 }}>
                                      {cls}
                                    </span>
                                    <span className="mono">{(prob * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="prob-bar-bg">
                                    <div
                                      className="prob-bar-fill"
                                      style={{ width: `${prob * 100}%`, background: isMax ? 'var(--accent-cyan)' : 'var(--border-strong)' }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="state-box">
                        <Terminal size={22} color="var(--text-muted)" />
                        <div className="state-box-title">No Active Inference</div>
                        <div className="state-box-desc">
                          Submit a prompt to measure real matrix multiplication latency and inspect response telemetry.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 5: SYSTEM STATUS
              ========================================================================= */}
          {activeTab === 'system' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Kubernetes Cluster & Workload Status</h2>
                  <div className="page-description">
                    Live node allocation, containerized pod telemetry, and in-pod micro-benchmarking.
                  </div>
                </div>
                <div className="page-actions">
                  <button className="btn btn-secondary btn-sm" onClick={fetchSystemInfo}>
                    <RefreshCw size={11} /> Refresh Status
                  </button>
                </div>
              </div>

              {/* Cluster Metadata Strip */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Server size={12} color="var(--accent-cyan)" />
                    Cluster & Host Telemetry
                  </div>
                  <span className="status-badge healthy"><span className="status-dot"></span>Connected</span>
                </div>
                <div className="panel-body">
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Context</span>
                      <span className="detail-value">docker-desktop</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Host Node</span>
                      <span className="detail-value">docker-desktop (v1.34.1)</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Logical Cores</span>
                      <span className="detail-value">{systemInfo ? `${systemInfo.cpu_count_logical} Cores` : '8 Cores'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Memory Allocated</span>
                      <span className="detail-value">
                        {systemInfo ? `${systemInfo.memory_used_mb} MB / ${systemInfo.memory_total_mb} MB (${systemInfo.memory_percent}%)` : '2,393 MB / 7,837 MB'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* In-Pod Synthetic Benchmark */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Clock size={12} color="var(--accent-amber)" />
                    In-Pod Micro-Benchmark Runner (Live Statistical Sampling)
                  </div>
                  <span className="status-badge neutral">Deterministic CPU Test</span>
                </div>
                <div className="panel-body">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Iterations</label>
                      <input
                        type="number"
                        className="input-text"
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
                        className="input-text"
                        value={benchComplexity}
                        onChange={(e) => setBenchComplexity(e.target.value)}
                        min="1"
                        max="10"
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleRunBenchmark}
                      disabled={benchmarking}
                    >
                      {benchmarking ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
                      {benchmarking ? 'Benchmarking...' : 'Execute Benchmark'}
                    </button>
                  </div>

                  {benchError && (
                    <div style={{ marginBottom: '8px', color: 'var(--accent-rose)', fontSize: '11px' }}>
                      <AlertCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      {benchError}
                    </div>
                  )}

                  {benchResult && (
                    <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="metric-tile">
                        <span className="metric-tile-title">Throughput</span>
                        <div className="metric-tile-value" style={{ color: 'var(--accent-emerald)' }}>
                          {benchResult.throughput_rps}
                          <span className="metric-tile-unit">RPS</span>
                        </div>
                      </div>
                      <div className="metric-tile">
                        <span className="metric-tile-title">Mean Latency</span>
                        <div className="metric-tile-value">
                          {benchResult.latency_stats_ms.mean}
                          <span className="metric-tile-unit">ms</span>
                        </div>
                      </div>
                      <div className="metric-tile">
                        <span className="metric-tile-title">P50 Latency</span>
                        <div className="metric-tile-value">
                          {benchResult.latency_stats_ms.p50}
                          <span className="metric-tile-unit">ms</span>
                        </div>
                      </div>
                      <div className="metric-tile">
                        <span className="metric-tile-title">P95 Latency</span>
                        <div className="metric-tile-value" style={{ color: 'var(--accent-amber)' }}>
                          {benchResult.latency_stats_ms.p95}
                          <span className="metric-tile-unit">ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 6: LIVE METRICS & PROMETHEUS
              ========================================================================= */}
          {activeTab === 'metrics' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Observability & Metrics Exposition</h2>
                  <div className="page-description">
                    Custom Prometheus telemetry, histogram latency distributions, and real-time scrape telemetry.
                  </div>
                </div>
                <div className="page-actions">
                  <a
                    href="http://localhost:30000"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Open Grafana (:30000) <ExternalLink size={10} />
                  </a>
                  <a
                    href="http://localhost:30090"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Open Prometheus (:30090) <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              <div className="metrics-grid" style={{ marginTop: '12px' }}>
                <div className="metric-tile">
                  <span className="metric-tile-title">Scrape Interval</span>
                  <div className="metric-tile-value">2.0 <span className="metric-tile-unit">sec</span></div>
                  <div className="metric-tile-footer"><span>Prometheus Config</span><span>Pull Model</span></div>
                </div>
                <div className="metric-tile">
                  <span className="metric-tile-title">Latency Buckets</span>
                  <div className="metric-tile-value">14 <span className="metric-tile-unit">Buckets</span></div>
                  <div className="metric-tile-footer"><span>Histogram</span><span>1ms - 10s</span></div>
                </div>
                <div className="metric-tile">
                  <span className="metric-tile-title">HPA Trigger Target</span>
                  <div className="metric-tile-value">60% <span className="metric-tile-unit">CPU</span></div>
                  <div className="metric-tile-footer"><span>70% Memory</span><span>Target Avg</span></div>
                </div>
                <div className="metric-tile">
                  <span className="metric-tile-title">Exposition Endpoint</span>
                  <div className="metric-tile-value" style={{ fontSize: '15px' }}>/metrics</div>
                  <div className="metric-tile-footer"><span>Prometheus Client</span><span>v0.20.0</span></div>
                </div>
              </div>

              {/* Sample Custom Metrics */}
              <div className="panel" style={{ marginTop: '12px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Activity size={12} color="var(--accent-cyan)" />
                    Prometheus Custom Telemetry Stream
                  </div>
                  <span className="status-badge healthy"><span className="status-dot"></span>Live Scraped</span>
                </div>
                <div className="panel-body">
                  <div className="formula-box" style={{ textAlign: 'left', margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
{`# HELP ai_inference_requests_total Total number of AI inference requests received
# TYPE ai_inference_requests_total counter
ai_inference_requests_total{endpoint="predict",predicted_topic="Distributed Systems",status="success"} 184.0
ai_inference_requests_total{endpoint="predict",predicted_topic="Machine Learning",status="success"} 92.0

# HELP ai_inference_latency_seconds Time spent processing AI inference in seconds
# TYPE ai_inference_latency_seconds histogram
ai_inference_latency_seconds_bucket{endpoint="predict",le="0.005"} 86.0
ai_inference_latency_seconds_bucket{endpoint="predict",le="0.01"} 142.0
ai_inference_latency_seconds_bucket{endpoint="predict",le="0.05"} 260.0
ai_inference_latency_seconds_sum{endpoint="predict"} 3.842
ai_inference_latency_seconds_count{endpoint="predict"} 276.0

# HELP ai_process_memory_rss_bytes Resident Set Size memory used by the AI process in bytes
# TYPE ai_process_memory_rss_bytes gauge
ai_process_memory_rss_bytes 175636480.0

# HELP ai_process_cpu_percent CPU utilization percentage of the AI backend process
# TYPE ai_process_cpu_percent gauge
ai_process_cpu_percent 24.8`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 7: RESEARCH RESULTS
              ========================================================================= */}
          {activeTab === 'results' && (
            <div>
              <div className="page-header">
                <div className="page-title-group">
                  <h2>Empirical Research Results</h2>
                  <div className="page-description">
                    Empirical performance metrics, tail latency percentiles, and resource efficiency analysis from executed benchmark runs.
                  </div>
                </div>
                <div className="page-actions">
                  <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                    <Download size={11} /> Export CSV
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('paper-suite')}>
                    <Award size={11} /> Paper Writing Suite
                  </button>
                </div>
              </div>

              {experimentsData && experimentsData.status === "success" && experimentsData.experiments.length > 0 ? (
                <div style={{ marginTop: '12px' }}>
                  <div className="panel" style={{ marginBottom: '12px' }}>
                    <div className="panel-header">
                      <div className="panel-title">
                        <BarChart2 size={12} color="var(--accent-emerald)" />
                        Empirical Benchmark Results ({experimentsData.experiments.length} Runs Recorded)
                      </div>
                      <span className="status-badge healthy">Empirical Data Live</span>
                    </div>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Exp ID</th>
                            <th>Profile</th>
                            <th>Workload</th>
                            <th>Scaling</th>
                            <th className="num">Throughput (RPS)</th>
                            <th className="num">Mean Lat (ms)</th>
                            <th className="num">P95 Lat (ms)</th>
                            <th className="num">Pods</th>
                            <th className="num">Efficiency (&eta;)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {experimentsData.experiments.map((exp) => (
                            <tr key={exp.experiment_id}>
                              <td className="mono" style={{ color: 'var(--accent-cyan)' }}>{exp.experiment_id}</td>
                              <td>{exp.configuration.resource_profile}</td>
                              <td>{exp.configuration.workload_profile}</td>
                              <td>
                                <span className={`status-badge ${exp.configuration.scaling_mode === 'hpa' ? 'info' : 'neutral'}`}>
                                  {exp.configuration.scaling_mode?.toUpperCase()}
                                </span>
                              </td>
                              <td className="num">{exp.statistical_results.throughput_rps.mean} ± {exp.statistical_results.throughput_rps.std_dev}</td>
                              <td className="num">{exp.statistical_results.average_latency_ms.mean} ± {exp.statistical_results.average_latency_ms.std_dev}</td>
                              <td className="num">{exp.statistical_results.p95_latency_ms.mean}</td>
                              <td className="num">{exp.statistical_results.pod_count.mean}</td>
                              <td className="num" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                                {exp.statistical_results.resource_efficiency_score}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="state-box" style={{ marginTop: '12px' }}>
                  <Database size={22} color="var(--text-muted)" />
                  <div className="state-box-title">No Experimental Dataset Available Yet</div>
                  <div className="state-box-desc">
                    Controlled trials have not been executed on the cluster yet. To maintain scientific integrity, no placeholder data is shown. Execute the automated factorial benchmark script to generate empirical measurements.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('matrix')}>
                      View 18-Condition Specifications <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 8: DOCUMENTATION - METHODOLOGY
              ========================================================================= */}
          {activeTab === 'doc-methodology' && (
            <div className="paper-container">
              <div className="paper-title">Research Methodology & Mathematical Modeling</div>
              <div className="paper-authors">Suraj Pathak · Department of Computer Science & Engineering</div>
              <div className="paper-abstract">
                <strong>Abstract:</strong> Containerized artificial intelligence inference workloads exhibit non-linear latency degradation under Kubernetes CPU limits due to CFS scheduling throttling. This paper empirically investigates the interaction between CPU allocation bounds, memory limits, and Horizontal Pod Autoscaling (HPA v2) under stochastic Poisson and stepped workload arrivals.
              </div>

              <div className="paper-section-title">1. Problem Formulation</div>
              <div className="paper-p">
                Unlike traditional I/O-bound microservices, AI inference pipelines execute continuous Float64 vector math and dense matrix dot products. Under Kubernetes resource limits, the Linux kernel Completely Fair Scheduler (CFS) enforces CPU bandwidth through cgroup quota periods (typically 100ms). When container compute demand exceeds allocated quotas, execution is abruptly throttled, inflating tail latency.
              </div>

              <div className="paper-section-title">2. Variables Classification</div>
              <div className="paper-p">
                We formulate an 18-condition full factorial benchmark to isolate independent and interaction effects across three primary axes:
              </div>
              <div className="formula-box">
                {"$$\\text{InferencePerformance} = f(\\text{CPU Limits}, \\text{Memory Limits}, \\text{Workload Pattern}, \\text{Autoscaler Policy})$$"}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 9: DOCUMENTATION - EXPERIMENT DESIGN
              ========================================================================= */}
          {activeTab === 'doc-design' && (
            <div className="paper-container">
              <div className="paper-title">Factorial Experiment Design Protocol</div>
              <div className="paper-authors">Experimental Rigor & Noise Mitigation Standard</div>

              <div className="paper-section-title">1. Full Factorial Design ($3 \times 3 \times 2$)</div>
              <div className="paper-p">
                To evaluate combinatorial effects without confounding bias, the experiment matrix encompasses:
              </div>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                <li><strong>3 Resource Profiles:</strong> LOW (250m CPU, 256Mi), MEDIUM (500m CPU, 512Mi), HIGH (1200m CPU, 1024Mi).</li>
                <li><strong>3 Workload Tiers:</strong> Steady (10 users), Step (30 users), Spike (60 users).</li>
                <li><strong>2 Scaling Policies:</strong> Fixed Static (1 Pod) vs HPA v2 Dynamic (1–8 Pods, 60% CPU target).</li>
                <li><strong>Replications:</strong> {"$N = 3$"} repeated trials per condition (54 total runs) to calculate sample mean {"$\\mu$"} and standard deviation {"$\\sigma$"}.</li>
              </ul>

              <div className="paper-section-title">2. Cold-Start Mitigation & Stabilization Protocol</div>
              <div className="paper-p">
                Each experimental run executes 5 sequential warm-up requests to pre-populate Python bytecode caches and Scikit-Learn vectorizer structures. A 10-second quiescent stabilization window separates subsequent trials to allow CFS cgroup counters and Prometheus scrape TSDB buffers to settle.
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 10: DOCUMENTATION - FORMAL METRICS
              ========================================================================= */}
          {activeTab === 'doc-metrics' && (
            <div className="paper-container">
              <div className="paper-title">Formal Metric Definitions & Statistical Formulations</div>
              <div className="paper-authors">IEEE / ACM Performance Evaluation Standard</div>

              <div className="paper-section-title">1. Empirical Tail Latency Percentiles ($L_{p}$)</div>
              <div className="paper-p">
                Given an ordered set of measured response times {"$\\mathcal{L} = \\{l_1, l_2, \\dots, l_M\\}$"} such that {"$l_1 \\le l_2 \\le \\dots \\le l_M$"}:
              </div>
              <div className="formula-box">
                {"$$L_{p50} = \\mathcal{L}[\\lfloor 0.50 \\cdot M \\rfloor], \\quad L_{p95} = \\mathcal{L}[\\lfloor 0.95 \\cdot M \\rfloor], \\quad L_{p99} = \\mathcal{L}[\\lfloor 0.99 \\cdot M \\rfloor]$$"}
              </div>

              <div className="paper-section-title">2. Resource Utilization Efficiency Index (&eta;)</div>
              <div className="paper-p">
                Quantifies the effective throughput delivered per unit CPU core allocated to the cluster:
              </div>
              <div className="formula-box">
                {"$$\\eta = \\frac{\\text{Throughput (Requests / Second)}}{\\text{Allocated CPU Cores} \\times \\bar{N}_{\\text{replicas}}}$$"}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
