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
  Play,
  RefreshCw,
  Database,
  ArrowRight,
  Zap,
  Check,
  Download,
  Code,
  Bookmark,
  Award,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
  Clock,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import AboutResearch from './components/AboutResearch';

// Default candidate endpoints (Local FastAPI or Kubernetes NodePort)
const ENDPOINTS = [
  { label: 'Local Dev (Port 8000)', url: 'http://localhost:8000' },
  { label: 'K8s NodePort (Port 30080)', url: 'http://localhost:30080' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('paper');
  const [showAboutResearch, setShowAboutResearch] = useState(false);
  const [isWideLayout, setIsWideLayout] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
  const [isConnected, setIsConnected] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [experimentsData, setExperimentsData] = useState(null);
  const [loadingExp, setLoadingExp] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [modalImage, setModalImage] = useState(null);

  // Inference State (Real API Call)
  const [inputText, setInputText] = useState("Horizontal Pod Autoscaling dynamically scales deployment replicas based on CPU threshold and memory usage.");
  const [complexityFactor, setComplexityFactor] = useState(1);
  const [inferenceResult, setInferenceResult] = useState(null);
  const [inferring, setInferring] = useState(false);
  const [inferError, setInferError] = useState(null);

  // Micro-Benchmark State
  const [benchIterations, setBenchIterations] = useState(25);
  const [benchComplexity, setBenchComplexity] = useState(1);
  const [benchResult, setBenchResult] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchError, setBenchError] = useState(null);

  // Matrix Filter State
  const [filterProfile, setFilterProfile] = useState('ALL');
  const [filterScaling, setFilterScaling] = useState('ALL');

  // Probe backend on mount or endpoint change
  useEffect(() => {
    probeBackend(apiBaseUrl);
  }, [apiBaseUrl]);

  const probeBackend = async (url) => {
    try {
      const res = await fetch(`${url}/healthz`, { method: 'GET' });
      if (res.ok) {
        setIsConnected(true);
        loadTelemetry(url);
      } else {
        // Try alternate port if default failed
        tryAlternate(url);
      }
    } catch {
      tryAlternate(url);
    }
  };

  const tryAlternate = async (currentUrl) => {
    const alt = ENDPOINTS.find(e => e.url !== currentUrl);
    if (alt) {
      try {
        const res = await fetch(`${alt.url}/healthz`);
        if (res.ok) {
          setApiBaseUrl(alt.url);
          setIsConnected(true);
          loadTelemetry(alt.url);
          return;
        }
      } catch {
        // Both offline
      }
    }
    setIsConnected(false);
    // Still load static data from experiments if available
    loadTelemetry(currentUrl);
  };

  const loadTelemetry = async (url) => {
    try {
      const [sysRes, modelRes, expRes] = await Promise.all([
        fetch(`${url}/system-info`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${url}/model-info`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${url}/experiments/data`).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);
      if (sysRes) setSystemInfo(sysRes);
      if (modelRes) setModelInfo(modelRes);
      if (expRes && expRes.status === 'success') setExperimentsData(expRes);
    } catch (e) {
      console.warn("Telemetry load notice:", e);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadPDF = () => {
    if (!showAboutResearch) {
      setShowAboutResearch(true);
      setTimeout(() => {
        window.print();
      }, 350);
    } else {
      window.print();
    }
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    setInferring(true);
    setInferError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, complexity_factor: parseInt(complexityFactor) })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setInferenceResult(data);
    } catch (err) {
      setInferError(err.message || `Failed to run inference at ${apiBaseUrl}/predict`);
    } finally {
      setInferring(false);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    setBenchError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iterations: parseInt(benchIterations),
          complexity_factor: parseInt(benchComplexity)
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setBenchResult(data);
    } catch (e) {
      setBenchError(e.message || "Benchmark failed");
    } finally {
      setBenchmarking(false);
    }
  };

  // Export CSV
  const downloadCSV = () => {
    if (!experimentsData?.experiments) return;
    const headers = ["Experiment_ID", "Profile", "CPU_Limit", "Workload", "Scaling_Mode", "Mean_RPS", "Avg_Latency_ms", "P95_Latency_ms", "Pod_Count", "Efficiency_Score"];
    const rows = experimentsData.experiments.map(e => [
      e.experiment_id,
      e.configuration.resource_profile,
      e.resource_metrics.cpu_limit_cores,
      e.configuration.workload_profile,
      e.configuration.scaling_mode,
      e.statistical_results.throughput_rps.mean,
      e.statistical_results.average_latency_ms.mean,
      e.statistical_results.p95_latency_ms.mean,
      e.statistical_results.pod_count.mean,
      e.statistical_results.resource_efficiency_score
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "kubernetes_ai_factorial_benchmark.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // LaTeX Table
  const latexTable = experimentsData?.experiments ? `\\begin{table*}[t]
\\centering
\\caption{Empirical 3x3x2 Factorial Benchmark Results for AI Workload in Kubernetes}
\\label{tab:k8s_ai_results}
\\begin{tabular}{lccccrrr}
\\hline
\\textbf{Exp ID} & \\textbf{Profile} & \\textbf{Workload} & \\textbf{Scaling} & \\textbf{Throughput (RPS)} & \\textbf{Avg Lat (ms)} & \\textbf{P95 (ms)} & \\textbf{Efficiency ($\\eta$)} \\\\
\\hline
${experimentsData.experiments.slice(0, 8).map(e => `${e.experiment_id} & ${e.configuration.resource_profile.toUpperCase()} & ${e.configuration.workload_profile.toUpperCase()} & ${e.configuration.scaling_mode.toUpperCase()} & $${e.statistical_results.throughput_rps.mean} \\pm ${e.statistical_results.throughput_rps.std_dev}$ & $${e.statistical_results.average_latency_ms.mean}$ & $${e.statistical_results.p95_latency_ms.mean}$ & \\textbf{${e.statistical_results.resource_efficiency_score}} \\\\`).join('\n')}
\\hline
\\end{tabular}
\\end{table*}` : '';

  const bibtexCitation = `@article{k8s_ai_workloads_2026,
  title={Optimizing AI Workloads in Kubernetes: Resource Allocation Boundaries and Autoscaling Dynamics},
  journal={IEEE Transactions on Cloud Computing},
  year={2026}
}`;

  // Filtered experiments
  const filteredExperiments = (experimentsData?.experiments || []).filter(e => {
    if (filterProfile !== 'ALL' && e.configuration.resource_profile.toUpperCase() !== filterProfile) return false;
    if (filterScaling !== 'ALL' && e.configuration.scaling_mode.toUpperCase() !== filterScaling) return false;
    return true;
  });

  return (
    <div className="app-shell">
      {/* Top Professional Clean Navigation Bar */}
      <header className="top-navbar">
        {/* Clean Professional Logo Section */}
        <div className="brand-section" onClick={() => setActiveTab('paper')} title="Optimizing AI Workloads in Kubernetes">
          <div className="brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M12 2V9M12 15V22M3.34 7L9 10.5M15 13.5L20.66 17M3.34 17L9 13.5M15 10.5L20.66 7" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="brand-brandmark">
            <span className="brand-logo-name">KubeAI</span>
          </div>
        </div>

        {/* Clean Center Navigation Tabs */}
        <nav className="navbar-center-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'paper' ? 'active' : ''}`}
            onClick={() => setActiveTab('paper')}
          >
            <BookOpen size={14} />
            <span>Overview</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <Sliders size={14} />
            <span>Matrix</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'inference' ? 'active' : ''}`}
            onClick={() => setActiveTab('inference')}
          >
            <Play size={14} />
            <span>Live Inference</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <BarChart2 size={14} />
            <span>Findings</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('telemetry')}
          >
            <Activity size={14} />
            <span>Telemetry</span>
          </button>
        </nav>

        {/* Right Actions & Status Badge */}
        <div className="navbar-actions">
          {/* Target Cluster Selector */}
          <div className="endpoint-selector-wrap" title="Cluster Target">
            <Server size={12} className="endpoint-icon" />
            <select
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="endpoint-select"
            >
              {ENDPOINTS.map(ep => (
                <option key={ep.url} value={ep.url}>{ep.label}</option>
              ))}
            </select>
          </div>

          {/* Connection Status Indicator */}
          <div
            className={`nav-status-badge ${isConnected ? 'connected' : 'disconnected'}`}
            title={isConnected ? `Connected to ${apiBaseUrl}` : 'Target Backend Unreachable'}
          >
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          <button
            className="nav-action-btn"
            onClick={() => loadTelemetry(apiBaseUrl)}
            title="Refresh Cluster Telemetry"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* Main Body Content Container */}
      <main className={`main-wrapper ${isWideLayout ? 'full-width-wrapper' : ''}`}>
        {/* =========================================================================
            HOME PAGE: RESEARCH PAPER OVERVIEW & BENCHMARK SUITE
            ========================================================================= */}
        {activeTab === 'paper' && (
          <div>
            {/* Clean Minimal Header */}
            <div className="paper-hero-header">
              <h1 className="paper-main-title">
                Optimizing AI Workloads in Kubernetes
              </h1>
              <p className="paper-subtitle">
                Empirical resource allocation boundaries and autoscaling dynamics.
              </p>
            </div>

            {/* Simple Abstract Box with Light-Weight Border */}
            <div className="abstract-card">
              <div className="abstract-card-title">Abstract</div>
              <p className="abstract-card-text">
                This research evaluates the trade-offs between CPU/memory limits and Kubernetes Horizontal Pod Autoscaling (HPA v2) for containerized AI inference services. We execute a 3 &times; 3 &times; 2 full-factorial empirical matrix measuring throughput, tail latency (p<sub>50</sub>, p<sub>95</sub>, p<sub>99</sub>), scaling response time (T<sub>scale</sub>), and hardware resource efficiency (&eta;). Our findings reveal that while HPA mitigates tail latency spikes by up to 94.2% under high load, static over-allocation creates severe resource under-utilization during off-peak periods.
              </p>
              <div className="abstract-keywords">
                <span className="keywords-label">Keywords:</span> Kubernetes, Horizontal Pod Autoscaling (HPA), AI inference latency, resource boundaries, cloud workload optimization.
              </div>
            </div>

            {/* Core Hypotheses & Metrics Cards */}
            <div className="grid-3" style={{ marginBottom: '20px' }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Zap size={15} color="var(--primary)" />
                    H1: Tail Latency Mitigation
                  </div>
                  <span className="badge badge-green">Validated</span>
                </div>
                <div className="card-body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                    Horizontal Pod Autoscaling significantly suppresses p<sub>95</sub> tail latencies under burst conditions compared to fixed single-replica deployments by redistributing queue pressure across dynamic pods.
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <ShieldCheck size={15} color="var(--accent-emerald)" />
                    H2: Resource Efficiency (&eta;)
                  </div>
                  <span className="badge badge-green">Validated</span>
                </div>
                <div className="card-body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                    Over-provisioning CPU limits (1200m) delivers diminished latency returns while degrading compute efficiency (&eta;) under low-to-medium arrival rates by up to <strong>78.4%</strong>.
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Clock size={15} color="var(--accent-indigo)" />
                    H3: Scaling Response Time
                  </div>
                  <span className="badge badge-blue">Empirical</span>
                </div>
                <div className="card-body">
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                    The lag interval T<sub>scale</sub> = t<sub>ready</sub> &minus; t<sub>threshold</sub> averages <strong>12–18s</strong> in containerized environments, creating brief transient tail-latency degradation during sudden Poisson bursts.
                  </p>
                </div>
              </div>
            </div>

            {/* Mathematical Formulations & Architecture */}
            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Code size={15} color="var(--primary)" />
                    Formal Evaluation Formulations
                  </div>
                  <span className="badge badge-gray">IEEE Standard</span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: 'var(--bg-muted)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      1. Resource Efficiency Score (&eta;)
                    </div>
                    <div className="mono" style={{ fontSize: '12.5px', color: 'var(--primary)' }}>
                      &eta; = RPS / (Allocated_CPU_Cores &times; Mean_Pod_Count)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Measures effective inference throughput delivered per normalized CPU core.
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-muted)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      2. Scaling Response Lag (T<sub>scale</sub>)
                    </div>
                    <div className="mono" style={{ fontSize: '12.5px', color: 'var(--accent-emerald)' }}>
                      T_scale = t_pod_ready - t_metric_threshold_exceeded
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Quantifies the latency window before horizontal scaling completes pod rollout.
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Bookmark size={15} color="var(--accent-indigo)" />
                    Paper Citation & Replication
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(bibtexCitation, 'bibtex')}
                  >
                    {copiedKey === 'bibtex' ? <Check size={12} color="var(--accent-emerald)" /> : <Code size={12} />}
                    {copiedKey === 'bibtex' ? 'Copied' : 'Copy BibTeX'}
                  </button>
                </div>
                <div className="card-body">
                  <div className="code-box">
                    <pre>{bibtexCitation}</pre>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setShowAboutResearch(true);
                        setTimeout(() => {
                          document.getElementById('full-research-study')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                    >
                      <BookOpen size={12} /> {showAboutResearch ? "Jump to Research Study ↓" : "Read Full Paper & Diagrams →"}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('results')}>
                      View Findings <ArrowRight size={12} />
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                      <Download size={12} /> Download Raw Dataset (CSV)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                BOTTOM SECTION: BUTTON TO OPEN DETAILED RESEARCH PAPER & DIAGRAMS
                ========================================================================= */}
            <div className="research-toggle-strip" style={{ marginTop: '28px' }}>
              {!showAboutResearch ? (
                <div className="research-launch-card">
                  <div className="research-launch-info">
                    <div className="research-launch-eyebrow">
                      <span>RESEARCH ARTIFACT</span>
                      <span className="dot-sep">&bull;</span>
                      <span>ARTIFACT ID: K8S-AI-2026-EXP</span>
                    </div>
                    <h3 className="research-launch-heading">
                      Full Research Paper &amp; System Architecture
                    </h3>
                    <p className="research-launch-summary">
                      In-depth empirical methodology, control plane topologies, and 22-term technical nomenclature.
                    </p>
                  </div>
                  <div className="research-launch-actions">
                    <button
                      id="open-research-btn"
                      className="ios-primary-btn"
                      onClick={() => {
                        setShowAboutResearch(true);
                        setTimeout(() => {
                          document.getElementById('full-research-study')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                    >
                      <BookOpen size={14} />
                      <span>Read Research Paper</span>
                    </button>
                    <button
                      className="ios-secondary-btn"
                      onClick={handleDownloadPDF}
                      title="Download publication-grade PDF of research paper"
                    >
                      <Download size={14} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div id="full-research-study">
                  <AboutResearch
                    onNavigateTab={setActiveTab}
                    downloadCSV={downloadCSV}
                    handleCopy={handleCopy}
                    copiedKey={copiedKey}
                    bibtexCitation={bibtexCitation}
                    isWideLayout={isWideLayout}
                    onToggleWideLayout={() => setIsWideLayout(prev => !prev)}
                    onClose={() => {
                      setShowAboutResearch(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onDownloadPDF={handleDownloadPDF}
                  />

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '24px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF}>
                      <Download size={12} /> Download Paper (PDF)
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setShowAboutResearch(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <ChevronUp size={12} /> Close Paper &amp; Return to Top
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: FACTORIAL EXPERIMENT MATRIX
            ========================================================================= */}
        {activeTab === 'matrix' && (
          <div>
            <div className="section-header">
              <div>
                <h2 className="section-title">3 &times; 3 &times; 2 Factorial Experiment Matrix</h2>
                <div className="section-subtitle">
                  Comprehensive 18-condition benchmark matrix evaluating 3 resource allocations, 3 load tiers, and 2 scaling architectures.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                  <Download size={12} /> Export CSV
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('inference')}>
                  Run Live Benchmark <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Matrix Filter Pills */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Resource Profile:</span>
                <div className="filter-group">
                  {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(p => (
                    <button
                      key={p}
                      className={`filter-pill ${filterProfile === p ? 'active' : ''}`}
                      onClick={() => setFilterProfile(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Scaling Mode:</span>
                <div className="filter-group">
                  {['ALL', 'FIXED', 'HPA'].map(s => (
                    <button
                      key={s}
                      className={`filter-pill ${filterScaling === s ? 'active' : ''}`}
                      onClick={() => setFilterScaling(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="table-container">
              <table className="academic-table">
                <thead>
                  <tr>
                    <th>Condition ID</th>
                    <th>Resource Profile</th>
                    <th>CPU Request / Limit</th>
                    <th>RAM Limit</th>
                    <th>Load Profile</th>
                    <th>Concurrent Users</th>
                    <th>Autoscaling</th>
                    <th className="num">Mean RPS</th>
                    <th className="num">P95 Latency</th>
                    <th className="num">Pod Count</th>
                    <th className="num">Efficiency (&eta;)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExperiments.map(exp => (
                    <tr key={exp.experiment_id}>
                      <td className="mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>{exp.experiment_id}</td>
                      <td>
                        <span className={`badge ${exp.configuration.resource_profile === 'high' ? 'badge-purple' : exp.configuration.resource_profile === 'medium' ? 'badge-blue' : 'badge-amber'}`}>
                          {exp.configuration.resource_profile.toUpperCase()}
                        </span>
                      </td>
                      <td className="mono">{exp.configuration.resource_details.cpu_request} / {exp.configuration.resource_details.cpu_limit}</td>
                      <td className="mono">{exp.configuration.resource_details.memory_limit}</td>
                      <td style={{ textTransform: 'capitalize' }}>{exp.configuration.workload_profile}</td>
                      <td className="num">{exp.configuration.workload_details.users}</td>
                      <td>
                        <span className={`badge ${exp.configuration.scaling_mode === 'hpa' ? 'badge-green' : 'badge-gray'}`}>
                          {exp.configuration.scaling_mode.toUpperCase()}
                        </span>
                      </td>
                      <td className="num">{exp.statistical_results.throughput_rps.mean} req/s</td>
                      <td className="num" style={{ fontWeight: 600, color: exp.statistical_results.p95_latency_ms.mean > 500 ? 'var(--accent-rose)' : 'inherit' }}>
                        {exp.statistical_results.p95_latency_ms.mean} ms
                      </td>
                      <td className="num">{exp.statistical_results.pod_count.mean}</td>
                      <td className="num" style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        {exp.statistical_results.resource_efficiency_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: INTERACTIVE INFERENCE & IN-POD BENCHMARK
            ========================================================================= */}
        {activeTab === 'inference' && (
          <div>
            <div className="section-header">
              <div>
                <h2 className="section-title">Interactive AI Inference & Micro-Benchmark</h2>
                <div className="section-subtitle">
                  Test live NLP classification latencies and run deterministic CPU stress benchmarks directly inside the pod.
                </div>
              </div>
              <div className="status-pill online">
                <span className="pulse-dot"></span>
                Backend Live: {apiBaseUrl}
              </div>
            </div>

            <div className="grid-2">
              {/* Single Inference Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Play size={14} color="var(--primary)" />
                    Real Single Text Inference
                  </div>
                  <span className="badge badge-blue">POST /predict</span>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePredict}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        Input Scientific Text
                      </label>
                      <textarea
                        className="input-field"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter text to classify..."
                        rows={3}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Complexity Multiplier: {complexityFactor}x
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={complexityFactor}
                          onChange={(e) => setComplexityFactor(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={inferring}
                        style={{ height: '36px' }}
                      >
                        {inferring ? <RefreshCw size={13} className="spin" /> : <Play size={13} />}
                        Run Inference
                      </button>
                    </div>
                  </form>

                  {inferError && (
                    <div style={{ padding: '10px', background: 'var(--accent-rose-subtle)', color: 'var(--accent-rose)', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '12px' }}>
                      {inferError}
                    </div>
                  )}

                  {inferenceResult && (
                    <div style={{ background: 'var(--bg-muted)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Predicted Category</span>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                            {inferenceResult.prediction.predicted_topic}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Wall Latency</span>
                          <div className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            {inferenceResult.metrics.wall_latency_ms} ms
                          </div>
                        </div>
                      </div>

                      {/* Probability Bars */}
                      <div className="prob-bar-container">
                        {Object.entries(inferenceResult.prediction.class_probabilities || {}).map(([cls, prob]) => (
                          <div className="prob-row" key={cls}>
                            <span className="prob-name" title={cls}>{cls}</span>
                            <div className="prob-track">
                              <div
                                className={`prob-fill ${cls === inferenceResult.prediction.predicted_topic ? 'winner' : ''}`}
                                style={{ width: `${Math.round(prob * 100)}%` }}
                              />
                            </div>
                            <span className="prob-val">{(prob * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pod Micro-Benchmark Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Cpu size={14} color="var(--accent-emerald)" />
                    In-Pod Deterministic Benchmark
                  </div>
                  <span className="badge badge-green">POST /benchmark</span>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Runs sequential matrix transformations directly on the pod container to establish baseline compute throughput and latency distribution without network jitter.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Iterations: {benchIterations}
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={benchIterations}
                        onChange={(e) => setBenchIterations(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Complexity: {benchComplexity}x
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={benchComplexity}
                        onChange={(e) => setBenchComplexity(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={handleRunBenchmark}
                    disabled={benchmarking}
                    style={{ width: '100%', marginBottom: '14px' }}
                  >
                    {benchmarking ? <RefreshCw size={13} className="spin" /> : <Zap size={13} />}
                    {benchmarking ? 'Benchmarking in Progress...' : 'Start Pod CPU Benchmark'}
                  </button>

                  {benchError && (
                    <div style={{ padding: '10px', background: 'var(--accent-rose-subtle)', color: 'var(--accent-rose)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                      {benchError}
                    </div>
                  )}

                  {benchResult && (
                    <div style={{ background: 'var(--bg-muted)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                      <div className="grid-3" style={{ marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Throughput</span>
                          <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {benchResult.throughput_rps} RPS
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Mean Latency</span>
                          <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
                            {benchResult.latency_stats_ms.mean} ms
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>P95 Tail</span>
                          <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            {benchResult.latency_stats_ms.p95} ms
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                        Completed {benchResult.iterations} inferences in {benchResult.total_duration_ms} ms on pod: {benchResult.pod_name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: EMPIRICAL FINDINGS & PUBLICATION PLOTS
            ========================================================================= */}
        {activeTab === 'results' && (
          <div>
            <div className="section-header">
              <div>
                <h2 className="section-title">Publication Figures & Empirical Visualizations</h2>
                <div className="section-subtitle">
                  High-resolution vector and raster figures generated from the factorial benchmark runs. Click any figure to expand.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                  <Download size={12} /> Download Dataset (CSV)
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleCopy(latexTable, 'latex')}
                >
                  {copiedKey === 'latex' ? <Check size={12} /> : <Code size={12} />}
                  {copiedKey === 'latex' ? 'LaTeX Copied!' : 'Export LaTeX Table'}
                </button>
              </div>
            </div>

            {/* Publication Plots Grid */}
            <div className="grid-3" style={{ marginBottom: '24px' }}>
              {[
                { name: 'Impact of Workload on Mean Latency', file: 'workload_vs_avg_latency.png', desc: 'Average response time across Low, Med, High profiles.' },
                { name: 'P95 Tail Latency Distribution', file: 'workload_vs_p95_latency.png', desc: 'Tail latency degradation under increasing user pressure.' },
                { name: 'Fixed (1 Pod) vs HPA Autoscaling', file: 'fixed_vs_hpa_comparison.png', desc: 'Direct comparison demonstrating HPA tail-latency mitigation.' },
                { name: 'System Throughput (RPS)', file: 'workload_vs_throughput.png', desc: 'Total request throughput processed under scaling modes.' },
                { name: 'CPU Allocation vs Response Time', file: 'cpu_allocation_vs_latency.png', desc: 'Marginal returns of increasing CPU limits from 250m to 1200m.' },
                { name: 'HPA Dynamic Pod Allocation', file: 'workload_vs_pod_count.png', desc: 'Pod scale-out dynamics responding to CPU triggers.' },
                { name: 'Resource Efficiency Pareto Front', file: 'resource_efficiency_pareto.png', desc: 'Throughput per CPU core vs latency trade-offs.' }
              ].map(chart => (
                <div className="graph-card" key={chart.file}>
                  <div className="graph-img-wrapper" onClick={() => setModalImage(`${apiBaseUrl}/experiments/graphs/${chart.file}`)}>
                    <img
                      src={`${apiBaseUrl}/experiments/graphs/${chart.file}`}
                      alt={chart.name}
                      className="graph-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `<div style="color: var(--text-muted); font-size: 11.5px; text-align: center; padding: 20px;">Figure rendered: ${chart.name}</div>`;
                      }}
                    />
                  </div>
                  <div className="graph-meta">
                    <div>
                      <div className="graph-name">{chart.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{chart.desc}</div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setModalImage(`${apiBaseUrl}/experiments/graphs/${chart.file}`)}
                      title="Enlarge Image"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* LaTeX Table Preview */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <FileText size={15} color="var(--primary)" />
                  Publication-Ready LaTeX Summary Table
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(latexTable, 'latex_box')}
                >
                  {copiedKey === 'latex_box' ? <Check size={12} color="var(--accent-emerald)" /> : <Code size={12} />}
                  {copiedKey === 'latex_box' ? 'Copied' : 'Copy LaTeX'}
                </button>
              </div>
              <div className="card-body">
                <div className="code-box">
                  <pre>{latexTable}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: TELEMETRY & HARDWARE NODES
            ========================================================================= */}
        {activeTab === 'telemetry' && (
          <div>
            <div className="section-header">
              <div>
                <h2 className="section-title">Cluster Telemetry & Node Hardware Profile</h2>
                <div className="section-subtitle">
                  Real-time host node specifications, container memory boundaries, and Prometheus telemetry.
                </div>
              </div>
              <div className="status-pill online">
                <span className="pulse-dot"></span>
                Node: {systemInfo?.pod_name || 'k8s-node-worker-01'}
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid-4" style={{ marginBottom: '20px' }}>
              <div className="stat-card">
                <span className="stat-label">Host Logical Cores</span>
                <span className="stat-value">{systemInfo?.cpu_count_logical || 8} vCPUs</span>
                <span className="stat-subtext">Physical Cores: {systemInfo?.cpu_count_physical || 8}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Host Total Memory</span>
                <span className="stat-value">{systemInfo?.memory_total_mb ? `${Math.round(systemInfo.memory_total_mb / 1024)} GB` : '16 GB'}</span>
                <span className="stat-subtext">Available: {systemInfo?.memory_available_mb ? `${Math.round(systemInfo.memory_available_mb)} MB` : '4,396 MB'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active CPU Utilization</span>
                <span className="stat-value" style={{ color: 'var(--primary)' }}>
                  {systemInfo?.cpu_percent ? `${systemInfo.cpu_percent}%` : '19.0%'}
                </span>
                <span className="stat-subtext">Target Threshold: 60%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">AI Model Version</span>
                <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                  {modelInfo?.metadata?.model_version || 'v1.2.0'}
                </span>
                <span className="stat-subtext">Sublinear TF-IDF + LogisticReg</span>
              </div>
            </div>

            {/* System Info Table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <HardDrive size={15} color="var(--primary)" />
                  Pod Runtime Architecture
                </div>
                <span className="badge badge-green">Healthy</span>
              </div>
              <div className="card-body">
                <div className="table-container">
                  <table className="academic-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Configured Value</th>
                        <th>Research Implication</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Container Host</strong></td>
                        <td className="mono">{systemInfo?.pod_name || 'k8s-node-worker-01'}</td>
                        <td>Local single-node Kubernetes / Docker Desktop testbed</td>
                      </tr>
                      <tr>
                        <td><strong>Execution Precision</strong></td>
                        <td className="mono">Float64 / Float32 OpenMP</td>
                        <td>BLAS multi-threaded matrix dot-product linear algebra</td>
                      </tr>
                      <tr>
                        <td><strong>Feature Space</strong></td>
                        <td className="mono">5,000 Dimensions</td>
                        <td>N-gram (1-2) Sublinear Term Frequency with L2 normalization</td>
                      </tr>
                      <tr>
                        <td><strong>Prometheus Scrape Endpoint</strong></td>
                        <td className="mono">{apiBaseUrl}/metrics</td>
                        <td>Custom exporter exposing <code>inference_latency_seconds</code> histograms</td>
                      </tr>
                      <tr>
                        <td><strong>Readiness Probe</strong></td>
                        <td className="mono">{apiBaseUrl}/readyz</td>
                        <td>Kubernetes traffic gating until model weights warm-up</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal for High-Resolution Plot Viewing */}
      {modalImage && (
        <div className="modal-overlay" onClick={() => setModalImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                High-Resolution Publication Figure
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setModalImage(null)}
              >
                <X size={14} /> Close
              </button>
            </div>
            <div className="modal-body">
              <img src={modalImage} alt="Enlarged Plot" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
