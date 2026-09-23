"""
Configuration settings for the AI Workload Backend service.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "AI-Workload-Kubernetes-Benchmark"
    APP_VERSION: str = "1.0.0"
    MODEL_NAME: str = "NLP-Sentiment-Topic-Classifier"
    MODEL_VERSION: str = "v1.2.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # AI Workload Inference Settings
    DEFAULT_COMPLEXITY_FACTOR: int = int(os.getenv("DEFAULT_COMPLEXITY_FACTOR", "1"))
    MAX_BATCH_SIZE: int = int(os.getenv("MAX_BATCH_SIZE", "64"))
    WORKER_THREADS: int = int(os.getenv("WORKER_THREADS", "4"))
    
    # Model Artifacts Path
    MODEL_PATH: str = os.getenv("MODEL_PATH", "app/model_artifacts.joblib")
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:30080",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
