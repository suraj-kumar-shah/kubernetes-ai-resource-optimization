import React, { useState } from 'react';
import {
  BookOpen,
  Server,
  Layers,
  Cpu,
  Activity,
  Sliders,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Download,
  Code,
  Check,
  FileText,
  Database,
  Search,
  HelpCircle,
  Users,
  Target,
  Maximize2,
  Minimize2,
  ChevronUp,
  X
} from 'lucide-react';

const GLOSSARY_TERMS = [
  {
    acronym: "HPA",
    fullName: "Horizontal Pod Autoscaler",
    category: "Kubernetes Elasticity",
    definition: "An automated Kubernetes control plane feedback loop that periodically interrogates metric APIs (such as CPU utilization from cAdvisor / Metrics Server) and dynamically scales the active replica count of a deployment up or down between configured minimum and maximum limits.",
    userRole: "Kubernetes Platform Engineers, Cloud Infrastructure Architects, and SREs (Site Reliability Engineers).",
    whyUse: "AI inference request arrival rates fluctuate drastically. A fixed single pod collapses under high concurrency (p95 tail latency surges to 2494.65 ms with 32.84% dropped requests). HPA automatically provisions new pods up to 8 replicas when CPU exceeds 60%, suppressing p95 tail latency by 97.0% down to 74.14 ms, while scaling down during idle periods to prevent wasted cloud spending."
  },
  {
    acronym: "CFS",
    fullName: "Completely Fair Scheduler",
    category: "Linux Kernel",
    definition: "The default CPU scheduling algorithm in the Linux kernel that allocates CPU execution time to competing tasks using red-black trees and virtual runtime accounting. In containerized environments, the CFS bandwidth controller enforces strict quota bounds via cpu.cfs_quota_us and cpu.cfs_period_us (default period: 100 ms).",
    userRole: "Systems Software Engineers, Linux Kernel Developers, and Container Runtime Architects (containerd, Docker, CRI-O).",
    whyUse: "In multi-tenant clusters, CFS prevents a single runaway container from starving neighbor pods of CPU resources. However, when an AI model executes multi-threaded matrix operations, a sudden thread burst can consume the entire 100ms CFS quota in the first 15–20 ms, causing the kernel to forcibly throttle (freeze) execution for the remaining 80 ms, producing severe tail latency spikes."
  },
  {
    acronym: "RPS",
    fullName: "Requests Per Second",
    category: "Performance Metrics",
    definition: "A fundamental throughput rate metric measuring the total count of successfully processed HTTP transactions delivered per second over the evaluation window (Throughput = N_success / Δt).",
    userRole: "Performance Engineers, Backend Developers, and Capacity Planners.",
    whyUse: "Determines the raw processing bandwidth of the inference system. In this research, RPS demonstrates whether enabling HPA allows the cluster to scale throughput proportionally from 18 RPS up to 124 RPS as user concurrency surges from 10 to 60 users."
  },
  {
    acronym: "p50, p90, p95, p99",
    fullName: "Percentile Response Latencies (50th, 90th, 95th, 99th)",
    category: "Statistical Telemetry",
    definition: "Statistical values dividing sorted request response latencies into percentile brackets. p50 represents the median user experience (50% faster, 50% slower); p95 is the cutoff below which 95% of requests complete (capturing the slowest 5% of requests); p99 isolates extreme 1% worst-case queuing delays.",
    userRole: "Site Reliability Engineers (SREs), Product Managers, and Distributed Systems Researchers.",
    whyUse: "Arithmetic average (mean) latency washes out severe tail latency spikes. Tail latencies (p95, p99) reveal the real-world impact of CFS CPU throttling and autoscaler startup delay, which are essential for enforcing Service Level Agreements (SLAs)."
  },
  {
    acronym: "SLO / SLA",
    fullName: "Service Level Objective / Service Level Agreement",
    category: "Cloud Reliability",
    definition: "A formal target commitment defining acceptable reliability and latency boundaries for a software service (e.g., '95% of inference requests must return in under 100 milliseconds'). An SLA is an external customer-facing contract with financial penalties; an SLO is the internal engineering threshold.",
    userRole: "Enterprise Cloud Architects, DevOps Leads, and Product Directors.",
    whyUse: "Provides the benchmark success criteria for evaluating whether a Kubernetes cluster configuration can reliably host production AI applications without violating business guarantees."
  },
  {
    acronym: "OOM",
    fullName: "Out-Of-Memory (Kernel OOM Killer)",
    category: "Linux Memory Management",
    definition: "A Linux kernel fail-safe mechanism that intervenes when physical RAM and swap space are completely exhausted. The kernel assigns badness scores and terminates the offending process (killing the container with Exit Code 137).",
    userRole: "Linux Kernel, Kubernetes Kubelet, and Infrastructure Engineers.",
    whyUse: "Unlike CPU capacity (which can be throttled), memory cannot be compressed or slowed down. If an AI inference request triggers memory allocations beyond the pod's memory limit (resources.limits.memory), the pod is immediately killed. This research identifies safe memory boundaries to avoid OOM crashes."
  },
  {
    acronym: "TF-IDF",
    fullName: "Term Frequency – Inverse Document Frequency",
    category: "Machine Learning & NLP",
    definition: "A foundational natural language processing algorithm and feature extraction technique that reflects the relative statistical importance of words in a document collection by multiplying individual term frequency by the inverse document frequency logarithm.",
    userRole: "Data Scientists, Machine Learning Engineers, and NLP Researchers.",
    whyUse: "Provides a CPU-intensive, deterministic text transformation pipeline that simulates real AI feature extraction and matrix operations in containerized microservices without needing multi-gigabyte GPU memory overhead."
  },
  {
    acronym: "NLP",
    fullName: "Natural Language Processing",
    category: "Machine Learning & NLP",
    definition: "A subfield of artificial intelligence focused on enabling computers to understand, interpret, and manipulate human language via statistical models, tokenization, and machine learning classifiers.",
    userRole: "AI/ML Researchers, Data Scientists, and NLP Application Engineers.",
    whyUse: "The inference payload used in our benchmark evaluates real-world text classification across multi-domain research papers, providing an authentic CPU-bound workload."
  },
  {
    acronym: "cgroup",
    fullName: "Control Group (Linux cgroups v2)",
    category: "Linux Kernel",
    definition: "A hierarchical Linux kernel subsystem that organizes processes into groups, monitoring and enforcing resource ceilings for CPU shares, memory limits, block I/O bandwidth, and network traffic.",
    userRole: "Container Runtimes (containerd, Docker, CRI-O) and Kubernetes Kubelet.",
    whyUse: "Forms the foundational virtualization boundary for all Kubernetes pods. In this research, cgroups enforce the Low (250m), Medium (500m), and High (1200m) CPU limits that we systematically evaluate."
  },
  {
    acronym: "ASGI",
    fullName: "Asynchronous Server Gateway Interface",
    category: "Python Web Runtime",
    definition: "A modern Python specification that enables asynchronous web servers (like Uvicorn) to communicate with web application frameworks (like FastAPI), facilitating non-blocking concurrent request handling.",
    userRole: "Python Backend Developers, API Engineers, and ML Deployment Engineers.",
    whyUse: "Powers the asynchronous microservice engine in our inference pods, allowing the FastAPI service to service concurrent incoming requests without thread blocking during I/O operations."
  },
  {
    acronym: "JIT",
    fullName: "Just-In-Time Compilation",
    category: "Runtime Optimization",
    definition: "A code execution technique where intermediate bytecode instructions are compiled into native machine code dynamically at runtime immediately before execution.",
    userRole: "Compiler Engineers and High-Performance ML Runtime Authors.",
    whyUse: "Accelerates numerical calculation loops after initial warm-up. In our experimental methodology, understanding JIT cold-start compilation informs our mandatory 30-second pre-test warm-up phase to avoid skewed benchmarks."
  },
  {
    acronym: "REST / HTTP",
    fullName: "Representational State Transfer / Hypertext Transfer Protocol",
    category: "Distributed Networking",
    definition: "The universal stateless communication standard over TCP/IP utilizing standard HTTP methods (such as GET and POST) and JSON payloads for client-server API interactions.",
    userRole: "API Designers, Web Developers, and Software Engineers.",
    whyUse: "Enables standard, decoupled communication between external load generators (Locust), client web applications, and internal Kubernetes inference pods."
  },
  {
    acronym: "NAT",
    fullName: "Network Address Translation",
    category: "Distributed Networking",
    definition: "A network routing technique that alters IP address information in packet headers while in transit across a traffic routing device.",
    userRole: "Network Engineers and Kubernetes kube-proxy / iptables.",
    whyUse: "Allows incoming traffic directed to the public Kubernetes NodePort (:30080) to be mapped and distributed transparently to the internal private IP addresses of dynamically provisioned pod replicas."
  },
  {
    acronym: "ECDF",
    fullName: "Empirical Cumulative Distribution Function",
    category: "Statistical Telemetry",
    definition: "A non-parametric statistical step function that estimates the underlying cumulative distribution function of an empirical sample set without assuming a normal (Gaussian) bell curve.",
    userRole: "Performance Analysts and Academic Systems Researchers.",
    whyUse: "Used in Equation (1) to calculate exact percentile tail latencies (p50, p95, p99) from actual collected trial response times without distortion."
  },
  {
    acronym: "T_scale",
    fullName: "Autoscaling Reaction Lag (Scale-Out Response Delay)",
    category: "Kubernetes Elasticity",
    definition: "The exact temporal delay interval (T_scale = t_ready - t_threshold) measured between when workload CPU utilization crosses the 60% threshold and when newly created pods pass readiness probes to begin serving traffic.",
    userRole: "Autoscaling Algorithm Designers and Cloud Infrastructure Evaluators.",
    whyUse: "Quantifies the critical 12–18s lag window where queuing buffers overflow and tail latency spikes, establishing the empirical baseline for why predictive autoscaling is needed."
  },
  {
    acronym: "η (Eta)",
    fullName: "Normalized Resource Utilization Efficiency Index",
    category: "Cloud Reliability",
    definition: "A standardized performance index formulated as Throughput (RPS) / [Allocated_CPU_Cores × Mean_Pod_Count], measuring how much useful work is delivered per normalized CPU core.",
    userRole: "FinOps (Cloud Financial Operations) Specialists and Cluster Capacity Planners.",
    whyUse: "Demonstrates that over-provisioning large CPU limits (1200m) for small workloads degrades hardware efficiency by 78.47%, proving that static allocation wastes valuable cloud budgets."
  },
  {
    acronym: "K8s",
    fullName: "Kubernetes",
    category: "Kubernetes Elasticity",
    definition: "The open-source container orchestration system (named with a numeronym: 'K' followed by 8 letters, ending with 's') for automating application deployment, horizontal scaling, and management across clusters.",
    userRole: "DevOps Teams, Cloud Architects, and Enterprise IT Organizations worldwide.",
    whyUse: "Serves as the experimental platform and target runtime environment for all resource allocation and autoscaling tests in this research study."
  },
  {
    acronym: "CPU / vCPU",
    fullName: "Central Processing Unit / Virtual CPU",
    category: "Linux Kernel",
    definition: "The primary computational processor that executes software instructions. In Kubernetes, CPU is allocated in millicores (1000m = 1 full vCPU core).",
    userRole: "Hardware Engineers, Cloud Architects, and Systems Administrators.",
    whyUse: "The primary computational bottleneck for AI inference vectorization and softmax classification in our container pods."
  },
  {
    acronym: "RAM",
    fullName: "Random Access Memory",
    category: "Linux Memory Management",
    definition: "Fast volatile hardware memory holding executing instructions, model weights, and intermediate tensor activation buffers during inference. Measured in mebibytes (Mi) and gigabytes (Gi).",
    userRole: "Systems Engineers and Application Developers.",
    whyUse: "Evaluated across three distinct memory bounds (256Mi, 512Mi, 1024Mi) to assess memory headroom requirements under multi-user concurrency."
  },
  {
    acronym: "JSON",
    fullName: "JavaScript Object Notation",
    category: "Distributed Networking",
    definition: "A lightweight, text-based, human-readable data interchange format consisting of key-value pairs and arrays.",
    userRole: "Full-Stack Developers, API Integrators, and Telemetry Systems.",
    whyUse: "Used for all REST API communication (/predict, /system-info) and structured raw experimental logging in experiments/processed/."
  },
  {
    acronym: "CSV",
    fullName: "Comma-Separated Values",
    category: "Performance Metrics",
    definition: "A delimited text storage file format that uses commas to separate tabular data values across rows and columns.",
    userRole: "Data Analysts, Researchers, and Statistical Tools (Pandas, Excel, R).",
    whyUse: "Provides a universal, transparent data export format allowing anyone to replicate, audit, and analyze the 54 empirical benchmark trials."
  },
  {
    acronym: "URI / URL",
    fullName: "Uniform Resource Identifier / Uniform Resource Locator",
    category: "Distributed Networking",
    definition: "A formal string of characters that unambiguously identifies and locates a network resource on the web.",
    userRole: "Web Engineers, Network Administrators, and API Consumers.",
    whyUse: "Locates backend microservice endpoints (http://localhost:8000, http://localhost:30080)."
  }
];

const GLOSSARY_CATEGORIES = [
  'ALL',
  'Kubernetes Elasticity',
  'Linux Kernel',
  'Performance Metrics',
  'Machine Learning & NLP',
  'Linux Memory Management',
  'Distributed Networking',
  'Cloud Reliability'
];

export default function AboutResearch({
  onNavigateTab,
  downloadCSV,
  handleCopy,
  copiedKey,
  bibtexCitation,
  isWideLayout,
  onToggleWideLayout,
  onClose,
  onDownloadPDF
}) {
  const [glossarySearch, setGlossarySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredGlossary = GLOSSARY_TERMS.filter(item => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (!glossarySearch.trim()) return true;
    const query = glossarySearch.toLowerCase();
    return (
      item.acronym.toLowerCase().includes(query) ||
      item.fullName.toLowerCase().includes(query) ||
      item.definition.toLowerCase().includes(query) ||
      item.userRole.toLowerCase().includes(query) ||
      item.whyUse.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`academic-paper-container ${isWideLayout ? 'full-width-container' : ''}`}>
      <article className="academic-article-frame">
        {/* Apple iOS-Inspired Journal Header */}
        <div className="academic-journal-banner">
          <div className="banner-left-wrap">
            <span className="banner-publisher-pill">IEEE Transactions</span>
            <span className="banner-title-text">Cloud Computing &bull; Research Article</span>
            <span className="dot-sep">&bull;</span>
            <span className="banner-artifact-id">K8S-AI-2026-EXP</span>
          </div>
          <div className="banner-actions-group">
            {onDownloadPDF && (
              <button
                className="ios-action-pill"
                onClick={onDownloadPDF}
                title="Download publication-grade PDF of research paper"
                aria-label="Download paper as PDF"
              >
                <Download size={13} />
                <span>Download PDF</span>
              </button>
            )}
            {onToggleWideLayout && (
              <button
                className={`ios-action-pill ${isWideLayout ? 'active' : ''}`}
                onClick={onToggleWideLayout}
                title={isWideLayout ? "Switch to standard centered view" : "Expand to full screen width"}
                aria-label="Toggle full screen reading width"
              >
                {isWideLayout ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{isWideLayout ? "Standard" : "Full Screen"}</span>
              </button>
            )}
            {onClose && (
              <button
                className="ios-action-pill ios-close-pill"
                onClick={onClose}
                title="Close / Hide Research Paper"
                aria-label="Close research paper"
              >
                <X size={13} />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Paper Title & Subtitle */}
        <h1 className="academic-title">
          Optimizing Containerized AI Workloads in Kubernetes: Resource Allocation Boundaries, Linux CFS Throttling, and Horizontal Pod Autoscaling Dynamics
        </h1>
        <div className="academic-subtitle">
          An empirical full-factorial benchmark evaluating microservice latency percentiles (p<sub>50</sub>, p<sub>95</sub>, p<sub>99</sub>), hardware efficiency (&eta;), and autoscaling reaction lag (T<sub>scale</sub>) under burst traffic.
        </div>

        {/* iOS Grouped Metadata Inset Card */}
        <div className="academic-meta-strip">
          <div className="academic-meta-cell">
            <span className="meta-cell-label">Subject Classification</span>
            <span className="meta-cell-val">Computer Systems Organization &rarr; Cloud Computing</span>
          </div>
          <div className="academic-meta-cell">
            <span className="meta-cell-label">Methodology</span>
            <span className="meta-cell-val">3 &times; 3 &times; 2 Full-Factorial (54 Randomized Trials)</span>
          </div>
          <div className="academic-meta-cell">
            <span className="meta-cell-label">Target Cluster</span>
            <span className="meta-cell-val">Kubernetes v1.28+ (cgroup v2 &bull; CFS Bandwidth)</span>
          </div>
        </div>

        {/* iOS Segmented Table of Contents Chips */}
        <nav className="academic-toc-bar" aria-label="Research Paper Sections">
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-abstract')}>Abstract</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-motivation')}>1.0 Motivation</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-glossary')}>2.0 Acronym Glossary</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-architecture')}>3.0 Architecture (Fig 1)</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-methodology')}>4.0 Factorial Design (Fig 2)</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-formulations')}>5.0 Formulations</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-timeline')}>6.0 Scaling Lag (Fig 3)</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-findings')}>7.0 Empirical Findings</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-validity')}>8.0 Threats to Validity</button>
          <button className="academic-toc-chip" onClick={() => scrollToSection('sec-references')}>9.0 References</button>
        </nav>

        {/* Formal Structured Abstract */}
        <section id="sec-abstract" className="academic-abstract-box">
          <div className="academic-abstract-content">
            <strong>Abstract&mdash;</strong>As machine learning inference pipelines transition into containerized microservices in multi-tenant Kubernetes clusters, configuring resource boundaries and autoscaling thresholds presents a critical trade-off between tail latency and compute cost. Unlike traditional stateless web applications, AI inference tasks are computationally intensive and memory-bound, exhibiting high non-linear variance under bursty request arrivals. Suboptimal CPU limits trigger Linux Completely Fair Scheduler (CFS) throttling, whereas conservative memory limits incur kernel Out-Of-Memory (OOM) pod evictions. Furthermore, the inherent latency in Horizontal Pod Autoscaling (HPA v2) metric aggregation, scheduling, and pod readiness creates an autoscaling reaction lag (T<sub>scale</sub> ≈ 12&ndash;18s) during which tail latencies deteriorate precipitously. In this paper, we conduct an extensive 3 &times; 3 &times; 2 full-factorial empirical study across 18 distinct operating conditions with 54 randomized benchmark trials. We systematically measure sustained throughput (RPS), response latency distributions (p<sub>50</sub>, p<sub>95</sub>, p<sub>99</sub>), CPU throttling, and a normalized resource efficiency index (&eta;). Our empirical findings demonstrate that enabling HPA v2 reduces tail latency (p<sub>95</sub>) by 97.0% under peak concurrency (dropping from 2494.65 ms to 74.14 ms) and eliminates request drops. Conversely, static over-provisioning degrades hardware efficiency (&eta;) by 78.47% during low-demand periods. Finally, we model the multi-stage timing sequence of T<sub>scale</sub> and establish quantitative guidelines for production AI cluster dimensioning.
          </div>
          <div className="academic-index-terms">
            <strong>Index Terms&mdash;</strong>Kubernetes, Horizontal Pod Autoscaling (HPA), AI Inference Latency, CFS Throttling, Resource Allocation, Microservices, Tail Latency, Cloud Economics.
          </div>
        </section>

        {/* =========================================================================
            SECTION 1.0: MOTIVATION & PROBLEM FORMULATION
            ========================================================================= */}
        <section id="sec-motivation" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">1.0</span> Research Motivation &amp; Problem Formulation
          </h2>

          <p className="academic-paragraph">
            The proliferation of cloud-native artificial intelligence has accelerated the migration of natural language processing (NLP), computer vision, and predictive analytics models into containerized microservice architectures. In Kubernetes clusters, multiple heterogeneous workloads share the underlying physical compute fabric. Operating AI inference at scale requires cluster operators to balance two diametrically opposed objectives: guaranteeing stringent Service Level Objectives (SLOs) for end-user latency while minimizing idle hardware over-provisioning costs.
          </p>

          <p className="academic-paragraph">
            In standard Kubernetes configurations, container resource management relies on the Linux Control Groups (cgroups v2) subsystem. Two primary kernel mechanisms govern container isolation:
          </p>

          <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px 18px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a', marginBottom: '4px' }}>
                A. Linux Completely Fair Scheduler (CFS) CPU Throttling
              </div>
              <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                When a container specification defines <code>resources.limits.cpu</code>, the Kubernetes Kubelet translates this quota into Linux CFS bandwidth parameters: <code>cpu.cfs_quota_us</code> and <code>cpu.cfs_period_us</code> (default period: 100 ms). If an inference thread pool executes complex tensor operations (e.g. matrix multiplications, n-gram tokenization) that consume the entire allotted quota within the first 15&ndash;20 ms of the period, the kernel CFS forcibly suspends the container processes for the remaining 80 ms. This periodic throttling induces severe tail-latency amplification, transforming a sub-20 ms inference calculation into a multi-second queuing delay.
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a', marginBottom: '4px' }}>
                B. Memory Ceiling &amp; Out-Of-Memory (OOM) Killer Eviction
              </div>
              <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                Unlike CPU time, memory cannot be throttled. When concurrent requests increase working set sizes due to matrix intermediate buffers and Python memory fragmentation, reaching <code>resources.limits.memory</code> triggers the kernel OOM-killer (terminating the container with Exit Code 137). This results in abrupt request dropping, transient pod restarts, and cascading cluster failures.
              </div>
            </div>
          </div>

          <p className="academic-paragraph">
            To address variable demand, Kubernetes provides the Horizontal Pod Autoscaler (HPA v2). However, HPA is inherently a reactive feedback control loop. In the presence of sudden Poisson or bursty arrivals, the latency of metric scraping (Prometheus / Metrics Server), evaluation hysteresis, scheduling, container image unpacking, and readiness probing introduces an <strong>Autoscaling Reaction Lag</strong> (T<sub>scale</sub>). During this lag window, the existing pods must absorb the entire surge, precipitating steep tail latency spikes.
          </p>
        </section>

        {/* =========================================================================
            SECTION 2.0: TECHNICAL NOMENCLATURE & ACRONYM GLOSSARY
            ========================================================================= */}
        <section id="sec-glossary" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">2.0</span> Technical Nomenclature &amp; Comprehensive Acronym Glossary
          </h2>

          <p className="academic-paragraph">
            To ensure complete academic clarity, this section establishes the formal nomenclature for all abbreviations, acronyms, and short forms utilized throughout the research paper, architecture diagrams, and experimental datasets. For each term, we provide its <strong>Full Form</strong>, <strong>Technical Definition</strong>, the <strong>Target User Roles</strong> who interact with it, and <strong>Why We Use It In This Research</strong>.
          </p>

          {/* Interactive Search & Filter Controls */}
          <div className="glossary-search-bar">
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="glossary-search-input"
                placeholder="Search acronym, full form, role, or concept (e.g. HPA, CFS, RPS)..."
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
              />
            </div>
            <div className="glossary-filter-pills">
              {GLOSSARY_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`glossary-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Rendered Glossary Cards */}
          <div className="glossary-grid">
            {filteredGlossary.map(item => (
              <div className="glossary-card" key={item.acronym}>
                <div className="glossary-card-top">
                  <div className="glossary-term-wrap">
                    <span className="glossary-code-badge">{item.acronym}</span>
                    <span className="glossary-full-title">{item.fullName}</span>
                  </div>
                  <span className="glossary-category-pill">{item.category}</span>
                </div>

                <div className="glossary-details-grid">
                  <div className="glossary-detail-item">
                    <span className="glossary-label">What It Is (Definition):</span>
                    <div className="glossary-desc">{item.definition}</div>
                  </div>

                  <div className="glossary-detail-item">
                    <span className="glossary-label">Who Uses It (User Roles):</span>
                    <div className="glossary-desc"><strong>{item.userRole}</strong></div>
                  </div>

                  <div className="glossary-detail-item">
                    <span className="glossary-label">Why We Use It In This Research (Purpose &amp; Utility):</span>
                    <div className="glossary-desc" style={{ color: '#0f172a' }}>{item.whyUse}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3.0: SYSTEM ARCHITECTURE & TOPOLOGY (FIGURE 1)
            ========================================================================= */}
        <section id="sec-architecture" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">3.0</span> System Architecture &amp; Kubernetes Control Plane Topology
          </h2>

          <p className="academic-paragraph">
            The experimental testbed architecture represents an enterprise-grade, high-throughput microservice inference pipeline deployed in a Kubernetes cluster. The topology integrates workload injection, ingress routing, isolated container pods, a real-time Prometheus telemetry harness, and an active HPA v2 autoscaling controller.
          </p>

          {/* FIGURE 1: VECTOR SVG DIAGRAM */}
          <div className="diagram-frame">
            <div className="diagram-svg-wrap">
              <svg viewBox="0 0 880 340" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background styling & grids */}
                <rect width="880" height="340" rx="8" fill="#ffffff" />
                <rect x="1" y="1" width="878" height="338" rx="7" stroke="#e2e8f0" strokeWidth="1.5" />

                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669" />
                  </marker>
                  <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706" />
                  </marker>
                </defs>

                {/* Subsystem 1: Workload Injection Harness */}
                <g transform="translate(24, 30)">
                  <rect width="160" height="270" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                  <rect x="0" y="0" width="160" height="30" rx="6" fill="#f1f5f9" />
                  <text x="14" y="20" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="sans-serif">LOAD GENERATION</text>

                  {/* Locust Box */}
                  <rect x="12" y="44" width="136" height="60" rx="5" fill="#ffffff" stroke="#94a3b8" />
                  <text x="22" y="66" fill="#0f172a" fontSize="12" fontWeight="600" fontFamily="sans-serif">Locust Harness</text>
                  <text x="22" y="82" fill="#64748b" fontSize="10.5" fontFamily="sans-serif">Headless Distributed</text>
                  <text x="22" y="96" fill="#2563eb" fontSize="10" fontWeight="600" fontFamily="monospace">POST /predict</text>

                  {/* Concurrency Tiers */}
                  <rect x="12" y="116" width="136" height="88" rx="5" fill="#ffffff" stroke="#94a3b8" />
                  <text x="22" y="134" fill="#334155" fontSize="10.5" fontWeight="600" fontFamily="sans-serif">Workload Tiers:</text>
                  <text x="22" y="152" fill="#059669" fontSize="10" fontFamily="monospace">&bull; Low: 10 Users</text>
                  <text x="22" y="170" fill="#d97706" fontSize="10" fontFamily="monospace">&bull; Med: 30 Users</text>
                  <text x="22" y="188" fill="#dc2626" fontSize="10" fontFamily="monospace">&bull; High: 60 Users</text>

                  {/* Protocol */}
                  <rect x="12" y="214" width="136" height="42" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="22" y="232" fill="#64748b" fontSize="9.5" fontFamily="sans-serif">Protocol: HTTP/1.1 REST</text>
                  <text x="22" y="246" fill="#64748b" fontSize="9.5" fontFamily="sans-serif">Warmup: 30s | Run: 45s</text>
                </g>

                {/* Arrow 1: Load to Ingress */}
                <line x1="184" y1="165" x2="228" y2="165" stroke="#2563eb" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="188" y="155" fill="#2563eb" fontSize="9" fontWeight="600" fontFamily="monospace">HTTP RPS</text>

                {/* Subsystem 2: Kubernetes Ingress & Service */}
                <g transform="translate(232, 70)">
                  <rect width="130" height="190" rx="6" fill="#f8fafc" stroke="#93c5fd" strokeWidth="1.2" />
                  <rect x="0" y="0" width="130" height="28" rx="6" fill="#eff6ff" />
                  <text x="12" y="18" fill="#1d4ed8" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">INGRESS LAYER</text>

                  <rect x="10" y="38" width="110" height="52" rx="4" fill="#ffffff" stroke="#bfdbfe" />
                  <text x="18" y="56" fill="#0f172a" fontSize="11" fontWeight="600" fontFamily="sans-serif">K8s Service</text>
                  <text x="18" y="70" fill="#2563eb" fontSize="9.5" fontFamily="monospace">Type: NodePort</text>
                  <text x="18" y="82" fill="#64748b" fontSize="9" fontFamily="monospace">Port: 30080</text>

                  <rect x="10" y="100" width="110" height="74" rx="4" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="18" y="118" fill="#334155" fontSize="10" fontWeight="600" fontFamily="sans-serif">Routing Engine:</text>
                  <text x="18" y="134" fill="#64748b" fontSize="9.5" fontFamily="sans-serif">&bull; kube-proxy</text>
                  <text x="18" y="148" fill="#64748b" fontSize="9.5" fontFamily="sans-serif">&bull; iptables NAT</text>
                  <text x="18" y="162" fill="#64748b" fontSize="9.5" fontFamily="sans-serif">&bull; Round-Robin</text>
                </g>

                {/* Fan-out Arrows to Pods */}
                <path d="M 362 145 L 392 110 L 418 110" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />
                <path d="M 362 165 L 418 165" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />
                <path d="M 362 185 L 392 220 L 418 220" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />

                {/* Subsystem 3: Container Pod Replicas */}
                <g transform="translate(422, 25)">
                  <rect width="210" height="280" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                  <rect x="0" y="0" width="210" height="30" rx="6" fill="#f1f5f9" />
                  <text x="14" y="20" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="sans-serif">POD REPLICA POOL (1..8 PODS)</text>

                  {/* Pod 1 */}
                  <rect x="10" y="40" width="190" height="66" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="18" y="58" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="sans-serif">Pod Replica 1 (Leader)</text>
                  <text x="18" y="74" fill="#475569" fontSize="9.5" fontFamily="monospace">FastAPI + Scikit-Learn TF-IDF</text>
                  <text x="18" y="88" fill="#059669" fontSize="9" fontFamily="monospace">CFS Quota: 250m/500m/1200m</text>
                  <text x="18" y="99" fill="#2563eb" fontSize="8.5" fontFamily="monospace">Metrics: /metrics (Prometheus)</text>

                  {/* Pod 2 */}
                  <rect x="10" y="116" width="190" height="66" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="18" y="134" fill="#0f172a" fontSize="11" fontWeight="700" fontFamily="sans-serif">Pod Replica 2</text>
                  <text x="18" y="150" fill="#475569" fontSize="9.5" fontFamily="monospace">FastAPI + Softmax Classifier</text>
                  <text x="18" y="164" fill="#059669" fontSize="9" fontFamily="monospace">Memory: 256Mi/512Mi/1024Mi</text>
                  <text x="18" y="175" fill="#2563eb" fontSize="8.5" fontFamily="monospace">Health Probe: /healthz (2s)</text>

                  {/* Pod N (Dynamic) */}
                  <rect x="10" y="192" width="190" height="66" rx="5" fill="#f0fdf4" stroke="#86efac" strokeDasharray="3 3" />
                  <text x="18" y="210" fill="#166534" fontSize="11" fontWeight="700" fontFamily="sans-serif">Pod Replica N (HPA Scaled)</text>
                  <text x="18" y="226" fill="#166534" fontSize="9.5" fontFamily="sans-serif">Dynamically provisioned during surge</text>
                  <text x="18" y="240" fill="#166534" fontSize="9" fontFamily="monospace">Readiness lag: 12-18s (T_scale)</text>
                  <text x="18" y="251" fill="#15803d" fontSize="8.5" fontWeight="600" fontFamily="sans-serif">Status: Ready &amp; Traffic Serving</text>
                </g>

                {/* Arrow from Pods to Telemetry */}
                <line x1="632" y1="165" x2="668" y2="165" stroke="#059669" strokeWidth="1.8" markerEnd="url(#arrow-green)" />
                <text x="634" y="155" fill="#059669" fontSize="8.5" fontWeight="600" fontFamily="monospace">5s scrape</text>

                {/* Subsystem 4: Monitoring & HPA Control Loop */}
                <g transform="translate(672, 30)">
                  <rect width="184" height="270" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                  <rect x="0" y="0" width="184" height="30" rx="6" fill="#f1f5f9" />
                  <text x="12" y="20" fill="#0f172a" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">AUTOSCALER &amp; METRICS</text>

                  {/* Prometheus & Metrics Server */}
                  <rect x="10" y="42" width="164" height="68" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="18" y="60" fill="#0f172a" fontSize="11" fontWeight="600" fontFamily="sans-serif">Telemetry Pipeline</text>
                  <text x="18" y="76" fill="#475569" fontSize="9.5" fontFamily="sans-serif">&bull; K8s Metrics Server</text>
                  <text x="18" y="90" fill="#475569" fontSize="9.5" fontFamily="sans-serif">&bull; Prometheus cAdvisor</text>
                  <text x="18" y="102" fill="#059669" fontSize="8.5" fontFamily="monospace">Interval: T_eval = 15s</text>

                  {/* HPA v2 Controller */}
                  <rect x="10" y="122" width="164" height="88" rx="5" fill="#eff6ff" stroke="#93c5fd" />
                  <text x="18" y="140" fill="#1e40af" fontSize="11" fontWeight="700" fontFamily="sans-serif">HPA v2 Controller</text>
                  <text x="18" y="156" fill="#1e40af" fontSize="9.5" fontFamily="monospace">Target: 60% CPU Util</text>
                  <text x="18" y="170" fill="#1e40af" fontSize="9.5" fontFamily="monospace">Min: 1 | Max: 8 Pods</text>
                  <text x="18" y="186" fill="#1e40af" fontSize="8.5" fontFamily="monospace">R_des = ceil(R &times; U/60%)</text>
                  <text x="18" y="198" fill="#2563eb" fontSize="8.5" fontWeight="600" fontFamily="sans-serif">Scale-out trigger issued</text>

                  {/* Feedback line back to Pods */}
                  <rect x="10" y="222" width="164" height="38" rx="4" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="18" y="238" fill="#334155" fontSize="9" fontWeight="600" fontFamily="sans-serif">Actuation: ReplicaSet API</text>
                  <text x="18" y="250" fill="#64748b" fontSize="8.5" fontFamily="monospace">Kubelet Pod Spawn Loop</text>
                </g>

                {/* Feedback Arrow: HPA back to Pod Pool */}
                <path d="M 750 260 L 750 318 L 527 318 L 527 305" stroke="#d97706" strokeWidth="1.8" strokeDasharray="4 3" markerEnd="url(#arrow-amber)" fill="none" />
                <text x="600" y="332" fill="#d97706" fontSize="9" fontWeight="700" fontFamily="sans-serif">Closed-Loop Scaling Feedback (&Delta;Replicas)</text>
              </svg>
            </div>
            <div className="figure-caption">
              <strong>Figure 1:</strong> Detailed Kubernetes AI Workload Deployment Topology, Ingress Load Routing, and Closed-Loop Horizontal Pod Autoscaling (HPA v2) Architecture.
            </div>
          </div>

          {/* Table 1: Cluster Specifications */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>
              Table 1: System Component Specifications &amp; Operational Roles
            </div>
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>Subsystem</th>
                  <th>Component / Engine</th>
                  <th>Configuration Parameters</th>
                  <th>Functional Responsibility</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Workload Ingress</strong></td>
                  <td>Locust v2.24 (Headless)</td>
                  <td>Poisson user spawn, 10&ndash;60 virtual users</td>
                  <td>Generates deterministic synthetic request distributions</td>
                </tr>
                <tr>
                  <td><strong>Service Routing</strong></td>
                  <td>kube-proxy (iptables)</td>
                  <td>NodePort 30080, sessionAffinity: None</td>
                  <td>Distributes inbound HTTP traffic equally across ready pods</td>
                </tr>
                <tr>
                  <td><strong>Inference Service</strong></td>
                  <td>FastAPI / Python 3.11</td>
                  <td>Uvicorn ASGI, Scikit-learn TF-IDF + Softmax</td>
                  <td>Performs text vectorization &amp; category inference</td>
                </tr>
                <tr>
                  <td><strong>Linux cgroup</strong></td>
                  <td>CFS Bandwidth Controller</td>
                  <td>cfs_period_us=100000, quota limits (250m&ndash;1200m)</td>
                  <td>Enforces hard CPU limits and memory eviction ceilings</td>
                </tr>
                <tr>
                  <td><strong>Autoscaler</strong></td>
                  <td>Kubernetes HPA v2</td>
                  <td>targetCPUUtilizationPercentage: 60%, 1&ndash;8 replicas</td>
                  <td>Periodically evaluates cluster load and adjusts ReplicaSet</td>
                </tr>
                <tr>
                  <td><strong>Telemetry</strong></td>
                  <td>Prometheus + cAdvisor</td>
                  <td>scrape_interval: 5s, evaluation_interval: 15s</td>
                  <td>Records fine-grained latency, RPS, and cgroup metrics</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4.0: EXPERIMENTAL METHODOLOGY & 3X3X2 MATRIX (FIGURE 2)
            ========================================================================= */}
        <section id="sec-methodology" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">4.0</span> Experimental Methodology &amp; 3 &times; 3 &times; 2 Factorial Matrix
          </h2>

          <p className="academic-paragraph">
            To decouple the non-linear interaction effects among CPU limits, request concurrency, and horizontal elasticity, we employ a <strong>full-factorial experimental design</strong>. Single-variable evaluations (varying only CPU or only workload) fail to reveal threshold saturation points where queueing delays transition from polynomial to exponential regimes.
          </p>

          <p className="academic-paragraph">
            The experimental matrix systematically traverses three orthogonal dimensions:
          </p>
          <ul style={{ paddingLeft: '24px', margin: '10px 0 16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            <li><strong>Dimension 1 &mdash; Resource Profiles (3 Levels):</strong> Low (250m CPU, 256Mi RAM), Medium (500m CPU, 512Mi RAM), High (1200m CPU, 1024Mi RAM).</li>
            <li><strong>Dimension 2 &mdash; Workload Concurrency (3 Levels):</strong> Low (10 users, 2 users/s spawn), Medium (30 users, 5 users/s spawn), High (60 users, 10 users/s spawn).</li>
            <li><strong>Dimension 3 &mdash; Scaling Architecture (2 Levels):</strong> Static Single Pod (Fixed 1-Pod baseline) vs. Elastic Dynamic Autoscaling (HPA v2, 1 to 8 pods).</li>
          </ul>

          {/* FIGURE 2: VECTOR SVG DIAGRAM */}
          <div className="diagram-frame">
            <div className="diagram-svg-wrap">
              <svg viewBox="0 0 880 290" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="880" height="290" rx="8" fill="#ffffff" />
                <rect x="1" y="1" width="878" height="288" rx="7" stroke="#e2e8f0" strokeWidth="1.5" />

                {/* Level 0: Root */}
                <g transform="translate(20, 115)">
                  <rect width="130" height="60" rx="6" fill="#f8fafc" stroke="#2563eb" strokeWidth="1.5" />
                  <text x="14" y="28" fill="#0f172a" fontSize="12" fontWeight="700" fontFamily="sans-serif">3&times;3&times;2 Factorial</text>
                  <text x="14" y="44" fill="#2563eb" fontSize="10" fontWeight="600" fontFamily="sans-serif">18 Conditions</text>
                  <text x="14" y="54" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">N = 3 (54 Trials)</text>
                </g>

                {/* Tree lines to Resource Profiles */}
                <path d="M 150 145 L 180 145 L 180 60 L 210 60" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                <path d="M 150 145 L 210 145" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                <path d="M 150 145 L 180 145 L 180 230 L 210 230" stroke="#94a3b8" strokeWidth="1.5" fill="none" />

                {/* Level 1: Resource Profiles */}
                {/* Low Profile */}
                <g transform="translate(210, 32)">
                  <rect width="150" height="56" rx="5" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.2" />
                  <text x="12" y="22" fill="#92400e" fontSize="11" fontWeight="700" fontFamily="sans-serif">LOW PROFILE</text>
                  <text x="12" y="36" fill="#78350f" fontSize="9.5" fontFamily="monospace">Req: 150m | Lim: 250m</text>
                  <text x="12" y="48" fill="#78350f" fontSize="9" fontFamily="monospace">RAM: 128Mi / 256Mi</text>
                </g>

                {/* Med Profile */}
                <g transform="translate(210, 117)">
                  <rect width="150" height="56" rx="5" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.2" />
                  <text x="12" y="22" fill="#1e40af" fontSize="11" fontWeight="700" fontFamily="sans-serif">MEDIUM PROFILE</text>
                  <text x="12" y="36" fill="#1e3a8a" fontSize="9.5" fontFamily="monospace">Req: 300m | Lim: 500m</text>
                  <text x="12" y="48" fill="#1e3a8a" fontSize="9" fontFamily="monospace">RAM: 256Mi / 512Mi</text>
                </g>

                {/* High Profile */}
                <g transform="translate(210, 202)">
                  <rect width="150" height="56" rx="5" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1.2" />
                  <text x="12" y="22" fill="#5b21b6" fontSize="11" fontWeight="700" fontFamily="sans-serif">HIGH PROFILE</text>
                  <text x="12" y="36" fill="#4c1d95" fontSize="9.5" fontFamily="monospace">Req: 800m | Lim: 1200m</text>
                  <text x="12" y="48" fill="#4c1d95" fontSize="9" fontFamily="monospace">RAM: 512Mi / 1024Mi</text>
                </g>

                {/* Level 2: Workload Concurrency (Branching) */}
                <path d="M 360 60 L 400 60" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
                <path d="M 360 145 L 400 145" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
                <path d="M 360 230 L 400 230" stroke="#94a3b8" strokeWidth="1.2" fill="none" />

                {/* Workload Clusters */}
                <g transform="translate(400, 25)">
                  <rect width="180" height="70" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="10" y="18" fill="#0f172a" fontSize="10" fontWeight="700" fontFamily="sans-serif">Workload Concurrency:</text>
                  <text x="10" y="34" fill="#059669" fontSize="9.5" fontFamily="sans-serif">&bull; 10 Users (C01, C02)</text>
                  <text x="10" y="48" fill="#d97706" fontSize="9.5" fontFamily="sans-serif">&bull; 30 Users (C03, C04)</text>
                  <text x="10" y="62" fill="#dc2626" fontSize="9.5" fontFamily="sans-serif">&bull; 60 Users (C05, C06)</text>
                </g>

                <g transform="translate(400, 110)">
                  <rect width="180" height="70" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="10" y="18" fill="#0f172a" fontSize="10" fontWeight="700" fontFamily="sans-serif">Workload Concurrency:</text>
                  <text x="10" y="34" fill="#059669" fontSize="9.5" fontFamily="sans-serif">&bull; 10 Users (C07, C08)</text>
                  <text x="10" y="48" fill="#d97706" fontSize="9.5" fontFamily="sans-serif">&bull; 30 Users (C09, C10)</text>
                  <text x="10" y="62" fill="#dc2626" fontSize="9.5" fontFamily="sans-serif">&bull; 60 Users (C11, C12)</text>
                </g>

                <g transform="translate(400, 195)">
                  <rect width="180" height="70" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="10" y="18" fill="#0f172a" fontSize="10" fontWeight="700" fontFamily="sans-serif">Workload Concurrency:</text>
                  <text x="10" y="34" fill="#059669" fontSize="9.5" fontFamily="sans-serif">&bull; 10 Users (C13, C14)</text>
                  <text x="10" y="48" fill="#d97706" fontSize="9.5" fontFamily="sans-serif">&bull; 30 Users (C15, C16)</text>
                  <text x="10" y="62" fill="#dc2626" fontSize="9.5" fontFamily="sans-serif">&bull; 60 Users (C17, C18)</text>
                </g>

                {/* Level 3: Scaling Modes & Matrix Output */}
                <path d="M 580 60 L 620 60" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
                <path d="M 580 145 L 620 145" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
                <path d="M 580 230 L 620 230" stroke="#94a3b8" strokeWidth="1.2" fill="none" />

                <g transform="translate(620, 25)">
                  <rect width="236" height="240" rx="6" fill="#f8fafc" stroke="#059669" strokeWidth="1.2" />
                  <rect x="0" y="0" width="236" height="28" rx="6" fill="#ecfdf5" />
                  <text x="12" y="18" fill="#065f46" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">SCALING MODES &amp; 54 RUNS</text>

                  <rect x="10" y="36" width="216" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="18" y="52" fill="#0f172a" fontSize="10" fontWeight="600" fontFamily="sans-serif">Mode 1: Fixed 1-Pod (Static)</text>
                  <text x="18" y="66" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">9 Conditions &times; 3 Reps = 27 Trials</text>

                  <rect x="10" y="86" width="216" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="18" y="102" fill="#0f172a" fontSize="10" fontWeight="600" fontFamily="sans-serif">Mode 2: HPA v2 (Dynamic 1..8)</text>
                  <text x="18" y="116" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">9 Conditions &times; 3 Reps = 27 Trials</text>

                  <rect x="10" y="136" width="216" height="92" rx="4" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="18" y="152" fill="#0f172a" fontSize="10" fontWeight="700" fontFamily="sans-serif">Statistical Controls (N=3):</text>
                  <text x="18" y="168" fill="#475569" fontSize="8.5" fontFamily="sans-serif">&bull; Sample Mean (&mu;) &amp; Std Dev (s)</text>
                  <text x="18" y="182" fill="#475569" fontSize="8.5" fontFamily="sans-serif">&bull; Empirical Percentiles: p50, p95, p99</text>
                  <text x="18" y="196" fill="#475569" fontSize="8.5" fontFamily="sans-serif">&bull; 30s Warmup (Cache stabilization)</text>
                  <text x="18" y="210" fill="#059669" fontSize="8.5" fontWeight="600" fontFamily="sans-serif">&bull; 10s Cooldown (HPA hysteresis reset)</text>
                </g>
              </svg>
            </div>
            <div className="figure-caption">
              <strong>Figure 2:</strong> 3 &times; 3 &times; 2 Full-Factorial Experimental Methodology Matrix showing the systematic exploration of compute constraints, request concurrency tiers, and horizontal elasticity policies.
            </div>
          </div>

          <p className="academic-paragraph">
            Each of the 18 conditions is executed over a sustained measurement window of 45 seconds following a 30-second automated warm-up cycle. A mandatory 10-second cooldown interval is enforced between successive trials to allow the Linux kernel CFS cgroup counters and Kubernetes HPA controller metrics to return to baseline quiescent states.
          </p>
        </section>

        {/* =========================================================================
            SECTION 5.0: MATHEMATICAL FORMULATIONS (EQUATIONS 1-5)
            ========================================================================= */}
        <section id="sec-formulations" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">5.0</span> Mathematical Formulations &amp; Latency Modeling
          </h2>

          <p className="academic-paragraph">
            To provide formal rigor and comparability with IEEE/ACM benchmarking standards, we define the mathematical formulations for all dependent metrics evaluated throughout the study.
          </p>

          {/* Equation 1: Latency Percentiles */}
          <div className="academic-subsec-heading">5.1 Latency Percentile Formulations (p<sub>50</sub>, p<sub>95</sub>, p<sub>99</sub>)</div>
          <p className="academic-paragraph">
            Let <em>L</em> = &#123;<em>l</em><sub>1</sub>, <em>l</em><sub>2</sub>, &hellip;, <em>l</em><sub>M</sub>&#125; denote the sequence of <em>M</em> request response latencies sorted in ascending order (<em>l</em><sub>1</sub> &le; <em>l</em><sub>2</sub> &le; &hellip; &le; <em>l</em><sub>M</sub>). The empirical cumulative distribution function (ECDF) <em>F</em>(<em>l</em>) and the <em>p</em>-th percentile latency <em>L</em><sub><em>p</em></sub> are defined as:
          </p>
          <div className="equation-row">
            <div className="equation-body">
              <em>L</em><sub><em>p</em></sub> = <em>F</em><sup>&minus;1</sup>(<em>p</em>) = inf &#123; <em>l</em> &isin; ℝ : (1 / <em>M</em>) &sum;<sub><em>i</em>=1</sub><sup><em>M</em></sup> 𝟙(<em>l</em><sub><em>i</em></sub> &le; <em>l</em>) &ge; <em>p</em> &#125;
            </div>
            <div className="equation-number">(1)</div>
          </div>
          <p className="academic-paragraph" style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Where 𝟙(&bull;) is the indicator function. The median <em>p</em><sub>50</sub> represents regular operating state, whereas the tail percentiles <em>p</em><sub>95</sub> and <em>p</em><sub>99</sub> quantify worst-case delays induced by CFS quota depletion and autoscaler queueing.
          </p>

          {/* Equation 2: Throughput RPS */}
          <div className="academic-subsec-heading">5.2 Empirical Sustained Throughput (RPS)</div>
          <p className="academic-paragraph">
            Throughput measures the rate of successfully processed inference requests over the measurement window &Delta;<em>t</em> = <em>t</em><sub>end</sub> &minus; <em>t</em><sub>start</sub>:
          </p>
          <div className="equation-row">
            <div className="equation-body">
              Throughput (RPS) = <em>N</em><sub>success</sub> / &Delta;<em>t</em> = ( &sum;<sub><em>i</em>=1</sub><sup><em>M</em></sup> 𝟙(HTTP_Status<sub><em>i</em></sub> = 200) ) / ( <em>t</em><sub>end</sub> &minus; <em>t</em><sub>start</sub> )
            </div>
            <div className="equation-number">(2)</div>
          </div>

          {/* Equation 3: HPA Desired Replica Formula */}
          <div className="academic-subsec-heading">5.3 Kubernetes HPA v2 Desired Replica Count</div>
          <p className="academic-paragraph">
            The Kubernetes autoscaler controller periodically reconciles the active pod replica count using a proportional control algorithm:
          </p>
          <div className="equation-row">
            <div className="equation-body">
              <em>R</em><sub>desired</sub> = &lceil; <em>R</em><sub>current</sub> &times; ( <em>U</em><sub>current</sub> / <em>U</em><sub>target</sub> ) &rceil;
            </div>
            <div className="equation-number">(3)</div>
          </div>
          <p className="academic-paragraph" style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Where <em>U</em><sub>current</sub> is the mean CPU utilization across all active pods sampled from cAdvisor, and <em>U</em><sub>target</sub> = 60% is the configured target utilization threshold. If <em>R</em><sub>desired</sub> &gt; <em>R</em><sub>current</sub>, the controller issues a scale-out event clamped by <em>R</em><sub>max</sub> = 8.
          </p>

          {/* Equation 4: Resource Efficiency Score */}
          <div className="academic-subsec-heading">5.4 Hardware Resource Utilization Efficiency (&eta;)</div>
          <p className="academic-paragraph">
            To penalize hardware over-provisioning and normalize throughput relative to allocated CPU capacity, we formulate the Resource Efficiency Score &eta;:
          </p>
          <div className="equation-row">
            <div className="equation-body">
              &eta; = Throughput (RPS) / [ <em>C</em><sub>limit</sub> &times; <em>R&#772;</em> ] &nbsp; [ requests &bull; s<sup>&minus;1</sup> &bull; Core<sup>&minus;1</sup> ]
            </div>
            <div className="equation-number">(4)</div>
          </div>
          <p className="academic-paragraph" style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Where <em>C</em><sub>limit</sub> is the per-pod CPU limit in normalized cores (e.g., 0.25 for 250m, 1.2 for 1200m) and <em>R&#772;</em> is the mean active pod count across the trial. A high &eta; signifies efficient compute saturation; a low &eta; exposes idle over-allocation.
          </p>

          {/* Equation 5: Scaling Reaction Lag */}
          <div className="academic-subsec-heading">5.5 Autoscaling Reaction Lag (T<sub>scale</sub>)</div>
          <p className="academic-paragraph">
            The reaction lag T<sub>scale</sub> represents the elapsed time between the initial load threshold breach and the instant newly provisioned replicas pass readiness probes to begin serving traffic:
          </p>
          <div className="equation-row">
            <div className="equation-body">
              T<sub>scale</sub> = <em>t</em><sub>ready</sub> &minus; <em>t</em><sub>threshold</sub> = <em>t</em><sub>eval</sub> + <em>t</em><sub>decision</sub> + <em>t</em><sub>sched</sub> + <em>t</em><sub>init</sub> + <em>t</em><sub>probe</sub>
            </div>
            <div className="equation-number">(5)</div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6.0: AUTOSCALING LAG TIMELINE (FIGURE 3)
            ========================================================================= */}
        <section id="sec-timeline" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">6.0</span> Autoscaling Reaction Lag &amp; Dynamic Response Timeline
          </h2>

          <p className="academic-paragraph">
            While Horizontal Pod Autoscaling successfully restores cluster equilibrium, its multi-stage control loop introduces an inescapable temporal delay. When traffic surges instantaneously from 10 to 60 users, incoming requests accumulate in socket buffers and worker queues (governed by Little&apos;s Law: <em>L</em> = &lambda;<em>W</em>). Figure 3 illustrates the chronological breakdown of T<sub>scale</sub> and its immediate correlation with tail latency.
          </p>

          {/* FIGURE 3: VECTOR SVG DIAGRAM */}
          <div className="diagram-frame">
            <div className="diagram-svg-wrap">
              <svg viewBox="0 0 880 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="880" height="300" rx="8" fill="#ffffff" />
                <rect x="1" y="1" width="878" height="298" rx="7" stroke="#e2e8f0" strokeWidth="1.5" />

                {/* Title */}
                <text x="24" y="26" fill="#0f172a" fontSize="12" fontWeight="700" fontFamily="sans-serif">
                  TIMELINE DECOMPOSITION OF AUTOSCALING REACTION LAG (T_scale ≈ 12&ndash;18 SECONDS)
                </text>

                {/* Timeline axis */}
                <line x1="60" y1="90" x2="820" y2="90" stroke="#cbd5e1" strokeWidth="2" />

                {/* Time markers on axis */}
                {/* t0 */}
                <circle cx="90" cy="90" r="5" fill="#2563eb" />
                <text x="90" y="75" fill="#2563eb" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="monospace">t0 (0s)</text>
                <text x="90" y="110" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Burst Onset</text>

                {/* t_threshold */}
                <circle cx="160" cy="90" r="5" fill="#d97706" />
                <text x="160" y="75" fill="#d97706" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="monospace">t_thresh (2s)</text>
                <text x="160" y="110" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="sans-serif">CPU &gt; 60%</text>

                {/* t_eval */}
                <circle cx="340" cy="90" r="5" fill="#4f46e5" />
                <text x="340" y="75" fill="#4f46e5" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="monospace">t_eval (10s)</text>
                <text x="340" y="110" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="sans-serif">HPA Poll (15s Loop)</text>

                {/* t_sched */}
                <circle cx="430" cy="90" r="4" fill="#0284c7" />
                <text x="430" y="75" fill="#0284c7" fontSize="9.5" fontWeight="600" textAnchor="middle" fontFamily="monospace">t_sched (11s)</text>
                <text x="430" y="110" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Pod Bind</text>

                {/* t_init */}
                <circle cx="560" cy="90" r="4" fill="#7c3aed" />
                <text x="560" y="75" fill="#7c3aed" fontSize="9.5" fontWeight="600" textAnchor="middle" fontFamily="monospace">t_init (14s)</text>
                <text x="560" y="110" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Runtime / Model</text>

                {/* t_ready */}
                <circle cx="680" cy="90" r="5" fill="#059669" />
                <text x="680" y="75" fill="#059669" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="monospace">t_ready (16s)</text>
                <text x="680" y="110" fill="#059669" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">/healthz Pass</text>

                {/* Steady State */}
                <circle cx="800" cy="90" r="5" fill="#0f172a" />
                <text x="800" y="75" fill="#0f172a" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="monospace">t_steady (22s)</text>
                <text x="800" y="110" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Equilibrium</text>

                {/* T_scale Bracket */}
                <line x1="160" y1="126" x2="680" y2="126" stroke="#dc2626" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="160" y1="122" x2="160" y2="130" stroke="#dc2626" strokeWidth="2" />
                <line x1="680" y1="122" x2="680" y2="130" stroke="#dc2626" strokeWidth="2" />
                <rect x="360" y="117" width="130" height="18" rx="3" fill="#fee2e2" />
                <text x="425" y="130" fill="#991b1b" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                  T_scale = 14.2s (Lag Window)
                </text>

                {/* Lower Dual Graph: Latency Spike vs Pod Replicas */}
                <g transform="translate(60, 145)">
                  {/* Graph frame */}
                  <rect width="760" height="130" rx="4" fill="#f8fafc" stroke="#e2e8f0" />

                  {/* Left Axis: Latency (ms) */}
                  <line x1="40" y1="15" x2="40" y2="115" stroke="#94a3b8" />
                  <text x="35" y="22" fill="#dc2626" fontSize="9" textAnchor="end" fontFamily="monospace">2500ms</text>
                  <text x="35" y="65" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">1250ms</text>
                  <text x="35" y="115" fill="#059669" fontSize="9" textAnchor="end" fontFamily="monospace">74ms</text>

                  {/* Right Axis: Replicas */}
                  <line x1="720" y1="15" x2="720" y2="115" stroke="#94a3b8" />
                  <text x="725" y="22" fill="#2563eb" fontSize="9" fontFamily="monospace">8 Pods</text>
                  <text x="725" y="65" fill="#2563eb" fontSize="9" fontFamily="monospace">4 Pods</text>
                  <text x="725" y="115" fill="#2563eb" fontSize="9" fontFamily="monospace">1 Pod</text>

                  {/* Latency Spike Curve (Red) */}
                  <path d="M 40 115 L 100 115 L 140 30 L 300 20 L 500 25 L 620 115 L 720 115" fill="none" stroke="#dc2626" strokeWidth="2.2" />
                  <rect x="220" y="22" width="170" height="18" rx="3" fill="#ffffff" stroke="#fca5a5" />
                  <text x="305" y="34" fill="#991b1b" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
                    Transient P95 Latency Spike: 2494ms
                  </text>

                  {/* Pod Replicas Curve (Blue Step) */}
                  <path d="M 40 115 L 500 115 L 510 65 L 610 65 L 620 20 L 720 20" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 2" />
                  <rect x="530" y="68" width="130" height="16" rx="3" fill="#ffffff" stroke="#bfdbfe" />
                  <text x="595" y="79" fill="#1e40af" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
                    Pod Step: 1 &rarr; 4 &rarr; 8 Replicas
                  </text>

                  {/* Legend */}
                  <rect x="45" y="12" width="12" height="3" fill="#dc2626" />
                  <text x="62" y="16" fill="#334155" fontSize="8.5" fontFamily="sans-serif">P95 Tail Latency</text>
                  <line x1="45" y1="28" x2="57" y2="28" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 2" />
                  <text x="62" y="30" fill="#334155" fontSize="8.5" fontFamily="sans-serif">Active Replicas</text>
                </g>
              </svg>
            </div>
            <div className="figure-caption">
              <strong>Figure 3:</strong> Chronological decomposition of the Autoscaling Reaction Lag (T<sub>scale</sub> ≈ 12&ndash;18s) and the resulting transient tail-latency queuing spike during sudden traffic bursts.
            </div>
          </div>

          <p className="academic-paragraph">
            The empirical delay comprises:
          </p>
          <ol style={{ paddingLeft: '24px', margin: '10px 0 16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            <li><strong>Metrics Collection Latency (t<sub>eval</sub>, 0&ndash;15s, mean 7.5s):</strong> The interval required for Kubelet cAdvisor to aggregate cgroup CPU counters and for the HPA controller loop to execute its periodic reconciliation.</li>
            <li><strong>Scheduler Decision &amp; Binding (t<sub>sched</sub>, &lt;1s):</strong> Filtering node candidates based on resource requests and committing the pod binding to etcd.</li>
            <li><strong>Container Initialization (t<sub>init</sub>, 2&ndash;4s):</strong> Spawning the Python 3.11 runtime, executing ASGI bindings, and pre-allocating the Scikit-learn TF-IDF model weights.</li>
            <li><strong>Readiness Probe Validation (t<sub>probe</sub>, 2s):</strong> Kubelet probe querying <code>/healthz</code>; the endpoint is registered to the Service iptables only after two consecutive successes.</li>
          </ol>
        </section>

        {/* =========================================================================
            SECTION 7.0: EMPIRICAL FINDINGS & HYPOTHESIS TESTING
            ========================================================================= */}
        <section id="sec-findings" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">7.0</span> Empirical Findings &amp; Statistical Hypothesis Verification
          </h2>

          <p className="academic-paragraph">
            We systematically evaluate the experimental data across the 18 factorial conditions. Table 2 provides the empirical summary of the primary trials, contrasting static single-replica allocations against elastic HPA scaling.
          </p>

          {/* Table 2: Empirical Results */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>
              Table 2: Empirical 3 &times; 3 &times; 2 Factorial Benchmark Results (Selected Conditions)
            </div>
            <table className="booktabs-table">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>CPU Limit</th>
                  <th>Workload</th>
                  <th>Scaling Mode</th>
                  <th className="num">Mean RPS</th>
                  <th className="num">p<sub>50</sub> (ms)</th>
                  <th className="num">p<sub>95</sub> (ms)</th>
                  <th className="num">Replicas</th>
                  <th className="num">Error Rate</th>
                  <th className="num">Efficiency (&eta;)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono" style={{ fontWeight: 600 }}>C01</td>
                  <td>250m</td>
                  <td>Low (10)</td>
                  <td>Fixed</td>
                  <td className="num">18.28</td>
                  <td className="num">12.4</td>
                  <td className="num">24.5</td>
                  <td className="num">1.0</td>
                  <td className="num">0.00%</td>
                  <td className="num" style={{ fontWeight: 700, color: '#059669' }}>73.12</td>
                </tr>
                <tr>
                  <td className="mono" style={{ fontWeight: 600 }}>C05</td>
                  <td>250m</td>
                  <td>High (60)</td>
                  <td>Fixed</td>
                  <td className="num">9.83</td>
                  <td className="num">1355.1</td>
                  <td className="num" style={{ color: '#dc2626', fontWeight: 700 }}>2494.6</td>
                  <td className="num">1.0</td>
                  <td className="num" style={{ color: '#dc2626', fontWeight: 700 }}>32.84%</td>
                  <td className="num">39.33</td>
                </tr>
                <tr style={{ background: '#f0fdf4' }}>
                  <td className="mono" style={{ fontWeight: 600, color: '#166534' }}>C06</td>
                  <td>250m</td>
                  <td>High (60)</td>
                  <td><strong>HPA</strong></td>
                  <td className="num" style={{ fontWeight: 700 }}>95.67</td>
                  <td className="num">40.3</td>
                  <td className="num" style={{ color: '#059669', fontWeight: 700 }}>74.1</td>
                  <td className="num">8.0</td>
                  <td className="num" style={{ color: '#059669', fontWeight: 700 }}>0.00%</td>
                  <td className="num" style={{ fontWeight: 700, color: '#059669' }}>47.84</td>
                </tr>
                <tr>
                  <td className="mono" style={{ fontWeight: 600 }}>C07</td>
                  <td>500m</td>
                  <td>Low (10)</td>
                  <td>Fixed</td>
                  <td className="num">18.64</td>
                  <td className="num">11.8</td>
                  <td className="num">22.1</td>
                  <td className="num">1.0</td>
                  <td className="num">0.00%</td>
                  <td className="num">37.28</td>
                </tr>
                <tr>
                  <td className="mono" style={{ fontWeight: 600 }}>C11</td>
                  <td>500m</td>
                  <td>High (60)</td>
                  <td>Fixed</td>
                  <td className="num">28.45</td>
                  <td className="num">680.4</td>
                  <td className="num">1180.2</td>
                  <td className="num">1.0</td>
                  <td className="num">14.20%</td>
                  <td className="num">56.90</td>
                </tr>
                <tr style={{ background: '#f0fdf4' }}>
                  <td className="mono" style={{ fontWeight: 600, color: '#166534' }}>C12</td>
                  <td>500m</td>
                  <td>High (60)</td>
                  <td><strong>HPA</strong></td>
                  <td className="num" style={{ fontWeight: 700 }}>112.40</td>
                  <td className="num">28.2</td>
                  <td className="num" style={{ color: '#059669', fontWeight: 700 }}>52.6</td>
                  <td className="num">6.0</td>
                  <td className="num" style={{ color: '#059669', fontWeight: 700 }}>0.00%</td>
                  <td className="num">37.47</td>
                </tr>
                <tr>
                  <td className="mono" style={{ fontWeight: 600 }}>C13</td>
                  <td>1200m</td>
                  <td>Low (10)</td>
                  <td>Fixed</td>
                  <td className="num">18.90</td>
                  <td className="num">10.8</td>
                  <td className="num">19.9</td>
                  <td className="num">1.0</td>
                  <td className="num">0.00%</td>
                  <td className="num" style={{ color: '#d97706', fontWeight: 700 }}>15.75</td>
                </tr>
                <tr style={{ background: '#f0fdf4' }}>
                  <td className="mono" style={{ fontWeight: 600, color: '#166534' }}>C18</td>
                  <td>1200m</td>
                  <td>High (60)</td>
                  <td><strong>HPA</strong></td>
                  <td className="num" style={{ fontWeight: 700 }}>124.80</td>
                  <td className="num">18.5</td>
                  <td className="num" style={{ color: '#059669', fontWeight: 700 }}>38.2</td>
                  <td className="num">4.0</td>
                  <td className="num" style={{ color: '#059669', fontWeight: 700 }}>0.00%</td>
                  <td className="num">26.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Three Hypothesis Verification Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '22px' }}>
            <div className="hypothesis-result-card validated">
              <div className="hypothesis-header">
                <span className="hypothesis-title">
                  Hypothesis 1 (H1: Tail Latency Suppression via Autoscaling)&mdash;CONFIRMED
                </span>
                <span className="badge badge-green">Empirically Validated</span>
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <strong>Finding:</strong> Under the high workload tier (60 concurrent users), fixed single-replica deployments suffered extensive CFS quota throttling, causing p<sub>95</sub> latency to surge to <strong>2494.65 ms</strong> with a <strong>32.84%</strong> request failure rate (Condition C05). Enabling HPA v2 (Condition C06) scaled the replica set to 8 pods, suppressing p<sub>95</sub> latency to <strong>74.14 ms</strong>&mdash;a <strong>97.0% reduction in tail latency</strong>&mdash;while completely eliminating failed requests (0.00% error rate).
              </p>
            </div>

            <div className="hypothesis-result-card validated">
              <div className="hypothesis-header">
                <span className="hypothesis-title">
                  Hypothesis 2 (H2: Diminishing Returns &amp; Over-Provisioning Efficiency Penalty)&mdash;CONFIRMED
                </span>
                <span className="badge badge-green">Empirically Validated</span>
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <strong>Finding:</strong> Over-provisioning CPU limits to 1200m (Condition C13) under low workload (10 users) yielded only marginal median latency gains (10.8 ms vs. 12.4 ms for 250m) while causing the normalized Resource Efficiency Score (&eta;) to plummet from <strong>73.12</strong> down to <strong>15.75</strong>&mdash;representing a <strong>78.47% degradation in compute efficiency</strong>. This confirms that static allocation for peak capacity creates unsustainable idle cloud operational expenses.
              </p>
            </div>

            <div className="hypothesis-result-card empirical">
              <div className="hypothesis-header">
                <span className="hypothesis-title">
                  Hypothesis 3 (H3: Autoscaling Reaction Lag &amp; Transient Queue Spike)&mdash;CONFIRMED
                </span>
                <span className="badge badge-blue">Empirical Characterization</span>
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <strong>Finding:</strong> The autoscaling reaction lag T<sub>scale</sub> was measured at <strong>12&ndash;18 seconds</strong> across all trials. During this latency window, requests queued behind throttled workers, generating a brief transient tail latency spike up to 2.49 seconds before newly provisioned pods began serving traffic. This validates the need for predictive autoscaling or traffic admission smoothing in latency-critical production clusters.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 8.0: THREATS TO VALIDITY
            ========================================================================= */}
        <section id="sec-validity" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">8.0</span> Threats to Validity &amp; Methodological Safeguards
          </h2>

          <p className="academic-paragraph">
            To ensure reproducible and generalizable results, we identify and mitigate potential threats to experimental validity:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', margin: '14px 0' }}>
            <div style={{ padding: '14px 16px', border: '1px solid var(--border-default)', borderRadius: '6px', background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                1. Internal Validity (Cold Start &amp; JIT Skew)
              </div>
              <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                Python ASGI startup and model cache pre-warming were neutralized by enforcing a 30-second automated warm-up cycle prior to recording metric samples. HPA controller hysteresis was isolated via a mandatory 10-second quiescent cooldown between consecutive trials.
              </div>
            </div>

            <div style={{ padding: '14px 16px', border: '1px solid var(--border-default)', borderRadius: '6px', background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                2. Construct Validity (Metric Selection)
              </div>
              <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                Arithmetic mean latency can mask severe tail delays under skewed distributions. We therefore prioritized empirical percentiles (p<sub>50</sub>, p<sub>95</sub>, p<sub>99</sub>) computed from raw sorted latency sets rather than relying on aggregated averages.
              </div>
            </div>

            <div style={{ padding: '14px 16px', border: '1px solid var(--border-default)', borderRadius: '6px', background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                3. External Validity (Model Complexity)
              </div>
              <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                While this benchmark utilized a Scikit-learn TF-IDF + Softmax NLP classifier, the CFS bandwidth throttling and HPA control loop dynamics are architectural properties of Linux cgroups and Kubernetes, translating directly to larger deep learning and Transformer inference deployments.
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 9.0: REFERENCES & BIBLIOGRAPHY
            ========================================================================= */}
        <section id="sec-references" className="academic-section">
          <h2 className="academic-sec-heading">
            <span className="academic-sec-num">9.0</span> Bibliographic References &amp; Replication Package
          </h2>

          <p className="academic-paragraph">
            The experimental methodology, data collection scripts, and container manifests adhere to open research standards. Below are the foundational citations referenced throughout this study:
          </p>

          <ol className="academic-ref-list">
            <li className="academic-ref-item">
              <span className="academic-ref-num">[1]</span>
              J. Dean and L. A. Barroso, &ldquo;The Tail at Scale,&rdquo; <em>Communications of the ACM</em>, vol. 56, no. 2, pp. 74&ndash;80, Feb. 2013.
            </li>
            <li className="academic-ref-item">
              <span className="academic-ref-num">[2]</span>
              B. Burns, B. Grant, D. Oppenheimer, E. Brewer, and J. Wilkes, &ldquo;Borg, Omega, and Kubernetes: Lessons learned from three container-management systems,&rdquo; <em>ACM Queue</em>, vol. 14, no. 1, pp. 70&ndash;93, 2016.
            </li>
            <li className="academic-ref-item">
              <span className="academic-ref-num">[3]</span>
              Linux Kernel Organization, &ldquo;CFS Bandwidth Control,&rdquo; <em>Linux Kernel Documentation</em>, Documentation/scheduler/sched-bwc.rst, 2024.
            </li>
            <li className="academic-ref-item">
              <span className="academic-ref-num">[4]</span>
              Kubernetes Authors, &ldquo;Horizontal Pod Autoscaling Architecture and Algorithms (v2),&rdquo; <em>Kubernetes Documentation</em>, https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/, 2026.
            </li>
            <li className="academic-ref-item">
              <span className="academic-ref-num">[5]</span>
              G. Casale, N. Mi, and E. Smirni, &ldquo;Autoscaling Multi-Tier Cloud Applications with Tail-Latency Guarantees,&rdquo; <em>IEEE Transactions on Cloud Computing</em>, vol. 8, no. 3, pp. 742&ndash;755, 2020.
            </li>
            <li className="academic-ref-item">
              <span className="academic-ref-num">[6]</span>
              D. Crankshaw, X. Wang, G. Zhou, M. J. Franklin, J. E. Gonzalez, and I. Stoica, &ldquo;Clipper: A Low-Latency Online Prediction Serving System,&rdquo; in <em>Proc. 14th USENIX Symposium on Networked Systems Design and Implementation (NSDI)</em>, 2017, pp. 613&ndash;627.
            </li>
            <li className="academic-ref-item">
              <span className="academic-ref-num">[7]</span>
              A. Verma, L. Pedrosa, M. Korupolu, D. Oppenheimer, E. Tune, and J. Wilkes, &ldquo;Large-scale cluster management at Google with Borg,&rdquo; in <em>Proc. 10th European Conference on Computer Systems (EuroSys)</em>, 2015, pp. 1&ndash;17.
            </li>
            <li className="academic-ref-item">
              <span className="academic-ref-num">[8]</span>
              M. Abadi et al., &ldquo;TensorFlow: A System for Large-Scale Machine Learning,&rdquo; in <em>Proc. 12th USENIX Symposium on Operating Systems Design and Implementation (OSDI)</em>, 2016, pp. 265&ndash;283.
            </li>
          </ol>

          {/* Paper Replication Box & Actions */}
          <div style={{ marginTop: '24px', padding: '16px 20px', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                  Artifact Replication &amp; Interactive Tools
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Inspect raw experiment data, execute live pod micro-benchmarks, or download dataset.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {onDownloadPDF && (
                  <button className="btn btn-secondary btn-sm" onClick={onDownloadPDF}>
                    <Download size={12} /> Download Paper (PDF)
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(bibtexCitation, 'bibtex')}
                >
                  {copiedKey === 'bibtex' ? <Check size={12} color="var(--accent-emerald)" /> : <Code size={12} />}
                  {copiedKey === 'bibtex' ? 'BibTeX Copied' : 'Copy BibTeX'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                  <Download size={12} /> Download Raw Dataset (CSV)
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('matrix')}>
                  View Factorial Matrix <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
