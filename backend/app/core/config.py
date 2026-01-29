import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://sentinel_user:sentinel_secure_pass_123@localhost:5432/sentinel_shield"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your_jwt_secret_key_change_in_production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Application
    APP_NAME: str = "SentinelShield AI"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost:3000",
    ]
    
    # Security
    BCRYPT_ROUNDS: int = 12
    PASSWORD_MIN_LENGTH: int = 12
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    
    # Threat Detection
    ANOMALY_SENSITIVITY: str = os.getenv("ANOMALY_SENSITIVITY", "medium")
    RISK_SCORE_THRESHOLD_ALERT: float = 0.6
    RISK_SCORE_THRESHOLD_BLOCK: float = 0.8
    VELOCITY_THRESHOLD: int = 5  # actions per minute
    
    # AI/ML
    MODEL_UPDATE_THRESHOLD: int = 100  # Trigger retraining after N feedback samples
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models/")
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Feature Flags
    ENABLE_AUTO_BLOCK: bool = os.getenv("ENABLE_AUTO_BLOCK", "false").lower() == "true"
    ENABLE_GEO_BLOCKING: bool = os.getenv("ENABLE_GEO_BLOCKING", "false").lower() == "true"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
