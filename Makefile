.PHONY: help setup build run-backend run-frontend k8s-deploy k8s-delete experiment analyze clean

help:
	@echo "AI Workload Kubernetes Optimization Research Platform"
	@echo "--------------------------------------------------------"
	@echo "make setup        - Check dependencies & build docker image"
	@echo "make k8s-deploy   - Deploy AI workload & Prometheus/Grafana to local Kubernetes"
	@echo "make k8s-delete   - Teardown Kubernetes ai-workload namespace"
	@echo "make experiment   - Run full automated factorial benchmark matrix"
	@echo "make analyze      - Parse raw results & generate publication graphs"
	@echo "make run-backend  - Start FastAPI backend locally"
	@echo "make run-frontend - Start React Vite frontend locally"
	@echo "make clean        - Clean temporary artifacts and python caches"

setup:
	./scripts/setup.sh

build:
	docker build -t ai-workload-backend:latest ./backend

k8s-deploy:
	./scripts/deploy.sh

k8s-delete:
	./scripts/delete.sh

experiment:
	./scripts/run-experiment.sh

analyze:
	./scripts/collect-results.sh

run-backend:
	cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	cd frontend && npm run dev

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
