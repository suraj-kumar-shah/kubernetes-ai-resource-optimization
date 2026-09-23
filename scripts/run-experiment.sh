#!/usr/bin/env bash
set -e

# Use python from backend venv if available, or fallback to python3
if [ -f "backend/venv/bin/python" ]; then
    PYTHON_EXEC="backend/venv/bin/python"
else
    PYTHON_EXEC="python3"
fi

echo "Running AI Workload Experiment Runner using: $PYTHON_EXEC"
$PYTHON_EXEC experiments/scripts/run_matrix_benchmark.py "$@"
