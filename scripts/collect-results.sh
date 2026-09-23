#!/usr/bin/env bash
set -e

if [ -f "backend/venv/bin/python" ]; then
    PYTHON_EXEC="backend/venv/bin/python"
else
    PYTHON_EXEC="python3"
fi

echo "=================================================================="
echo "Parsing Experiment Telemetry & Generating Publication Visualizations"
echo "=================================================================="

$PYTHON_EXEC experiments/scripts/parse_metrics.py
$PYTHON_EXEC experiments/scripts/generate_visualizations.py

echo ""
echo "✓ Results processed in 'experiments/processed/' and graphs in 'experiments/graphs/'"
