from uuid import UUID
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, INET
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

# ============================================================================
# ORGANIZATIONS MODEL
# ============================================================================
class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True, nullable=False)
    subscription_tier = Column(String(50), nullable=False, default="starter")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    org_metadata = Column(JSONB, nullable=False, default={})
    
    # Settings
    max_users = Column(Integer, nullable=False, default=10)
    max_api_calls_per_day = Column(Integer, nullable=False, default=10000)
    enable_mfa = Column(Boolean, nullable=False, default=False)
    enable_sso = Column(Boolean, nullable=False, default=False)
    retention_days = Column(Integer, nullable=False, default=90)
    
    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    threat_logs = relationship("ThreatLog", back_populates="organization", cascade="all, delete-orphan")
    audit_trails = relationship("AuditTrail", back_populates="organization", cascade="all, delete-orphan")
    security_policies = relationship("SecurityPolicy", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="organization", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    feedback_buffer = relationship("AIFeedbackBuffer", back_populates="organization", cascade="all, delete-orphan")
    model_jobs = relationship("ModelRetrainingJob", back_populates="organization", cascade="all, delete-orphan")

# ============================================================================
# USERS MODEL
# ============================================================================
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_org_email"),
        Index("idx_users_organization_id", "organization_id"),
        Index("idx_users_email", "email"),
        Index("idx_users_role", "organization_id", "role"),
    )
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PG_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="viewer")  # admin, analyst, viewer
    is_active = Column(Boolean, nullable=False, default=True)
    last_login = Column(DateTime(timezone=True))
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret = Column(String(255))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    audit_trails = relationship("AuditTrail", back_populates="user")
    feedback_buffer = relationship("AIFeedbackBuffer", back_populates="analyst")

# ============================================================================
# THREAT LOGS MODEL
# ============================================================================
class ThreatLog(Base):
    __tablename__ = "threat_logs"
    __table_args__ = (
        Index("idx_threat_logs_org_timestamp", "organization_id", "timestamp"),
        Index("idx_threat_logs_severity", "organization_id", "severity"),
        Index("idx_threat_logs_source_ip", "source_ip"),
        Index("idx_threat_logs_ai_flagged", "organization_id", "ai_flagged"),
        Index("idx_threat_logs_created_at", "created_at"),
    )
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PG_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    source_ip = Column(INET, nullable=False)
    destination_ip = Column(INET)
    user_id = Column(String(255))
    user_agent = Column(Text)
    action = Column(String(255), nullable=False)
    resource = Column(String(255), nullable=False)
    method = Column(String(10))  # GET, POST, DELETE, etc.
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    anomaly_score = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0)
    severity = Column(String(50), default="low")  # low, medium, high, critical
    is_blocked = Column(Boolean, nullable=False, default=False)
    ai_flagged = Column(Boolean, nullable=False, default=False)
    false_positive = Column(Boolean)
    raw_data = Column(JSONB, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="threat_logs")
    feedback = relationship("AIFeedbackBuffer", back_populates="threat_log")

# ============================================================================
# AUDIT TRAILS MODEL
# ============================================================================
class AuditTrail(Base):
    __tablename__ = "audit_trails"
    __table_args__ = (
        Index("idx_audit_trails_org_timestamp", "organization_id", "created_at"),
        Index("idx_audit_trails_action_type", "organization_id", "action_type"),
        Index("idx_audit_trails_user_id", "user_id"),
    )
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PG_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action_type = Column(String(255), nullable=False)
    resource_type = Column(String(255), nullable=False)
    resource_id = Column(String(255))
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(Text)
    status = Column(String(50), default="success")
    error_message = Column(Text)
    content_hash = Column(String(64), nullable=False)  # SHA-256
    previous_hash = Column(String(64))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="audit_trails")
    user = relationship("User", back_populates="audit_trails")

# ============================================================================
# AI FEEDBACK BUFFER MODEL
# ============================================================================
class AIFeedbackBuffer(Base):
    __tablename__ = "ai_feedback_buffer"
    __table_args__ = (
        Index("idx_feedback_buffer_org_processed", "organization_id", "is_processed"),
        Index("idx_feedback_buffer_analyst", "analyst_id"),
        Index("idx_feedback_buffer_created_at", "created_at"),
    )
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PG_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    threat_log_id = Column(PG_UUID(as_uuid=True), ForeignKey("threat_logs.id"), nullable=True)
    analyst_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    original_classification = Column(String(50), nullable=False)
    corrected_classification = Column(String(50), nullable=False)
    confidence_score = Column(Float, default=0.0)
    reason = Column(Text)
    is_processed = Column(Boolean, nullable=False, default=False)
    processed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="feedback_buffer")
    threat_log = relationship("ThreatLog", back_populates="feedback")
    analyst = relationship("User", back_populates="feedback_buffer")

# ============================================================================
# SECURITY POLICIES MODEL
# ============================================================================
class SecurityPolicy(Base):
    __tablename__ = "security_policies"
    __table_args__ = (
        Index("idx_security_policies_org_id", "organization_id"),
    )
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PG_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, unique=True)
    risk_score_threshold_alert = Column(Float, nullable=False, default=0.6)
    risk_score_threshold_block = Column(Float, nullable=False, default=0.8)
    velocity_threshold = Column(Integer, nullable=False, default=5)
    anomaly_sensitivity = Column(String(50), nullable=False, default="medium")
    enable_auto_block = Column(Boolean, nullable=False, default=False)
    enable_geo_blocking = Column(Boolean, nullable=False, default=False)
    blocked_countries = Column(Text)  # JSON array
    enable_ip_reputation_check = Column(Boolean, nullable=False, default=True)
    suspicious_activity_alert_email = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="security_policies")

# ============================================================================
# API KEYS MODEL
# ============================================================================
class APIKey(Base):
    __tablename__ = "api_keys"
    __table_args__ = (
        Index("idx_api_keys_org", "organization_id"),
        Index("idx_api_keys_hash", "key_hash"),
    )
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PG_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    key_hash = Column(String(255), nullable=False, unique=True)
    key_prefix = Column(String(10), nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    last_used_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="api_keys")
    user = relationship("User", back_populates="api_keys")

# ============================================================================
# SETTINGS MODEL
# ============================================================================
class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PG_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, unique=True)
    theme = Column(String(50), default="dark")
    timezone = Column(String(50), default="UTC")
    notification_preferences = Column(JSONB, nullable=False, default={})
    custom_fields = Column(JSONB, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="settings")

# ============================================================================
# MODEL RETRAINING JOBS MODEL
# ============================================================================
class ModelRetrainingJob(Base):
    __tablename__ = "model_retraining_jobs"
    __table_args__ = (
        Index("idx_model_jobs_org_status", "organization_id", "status"),
        Index("idx_model_jobs_created_at", "created_at"),
    )
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(PG_UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    job_type = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending, running, completed, failed
    feedback_count = Column(Integer, nullable=False, default=0)
    training_start_time = Column(DateTime(timezone=True))
    training_end_time = Column(DateTime(timezone=True))
    model_accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    error_message = Column(Text)
    model_version = Column(String(50))
    is_deployed = Column(Boolean, nullable=False, default=False)
    deployed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="model_jobs")
