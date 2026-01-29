from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# ============================================================================
# ORGANIZATION SCHEMAS
# ============================================================================
class OrganizationBase(BaseModel):
    name: str
    domain: str
    subscription_tier: str = "starter"
    enable_mfa: bool = False
    enable_sso: bool = False

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    subscription_tier: Optional[str] = None
    enable_mfa: Optional[bool] = None
    enable_sso: Optional[bool] = None

class OrganizationResponse(OrganizationBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# USER SCHEMAS
# ============================================================================
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "viewer"

class UserCreate(UserBase):
    password: str = Field(..., min_length=12)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    last_login: Optional[datetime] = None
    mfa_enabled: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ============================================================================
# THREAT LOG SCHEMAS
# ============================================================================
class ThreatLogBase(BaseModel):
    source_ip: str
    destination_ip: Optional[str] = None
    user_id: Optional[str] = None
    action: str
    resource: str
    method: Optional[str] = None
    status_code: Optional[int] = None

class ThreatLogCreate(ThreatLogBase):
    pass

class ThreatLogResponse(ThreatLogBase):
    id: UUID
    timestamp: datetime
    anomaly_score: float
    risk_score: float
    severity: str
    is_blocked: bool
    ai_flagged: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ThreatLogList(BaseModel):
    total: int
    items: List[ThreatLogResponse]

# ============================================================================
# THREAT STATISTICS SCHEMAS
# ============================================================================
class ThreatStats(BaseModel):
    total_threats: int
    critical_threats: int
    high_threats: int
    medium_threats: int
    low_threats: int
    blocked_count: int
    blocked_percentage: float

class DailyThreatStats(BaseModel):
    date: str
    count: int
    severity_breakdown: dict

# ============================================================================
# AUDIT TRAIL SCHEMAS
# ============================================================================
class AuditTrailBase(BaseModel):
    action_type: str
    resource_type: str
    resource_id: Optional[str] = None

class AuditTrailResponse(AuditTrailBase):
    id: UUID
    action_type: str
    resource_type: str
    resource_id: Optional[str]
    old_values: Optional[dict]
    new_values: Optional[dict]
    status: str
    created_at: datetime
    user_id: Optional[UUID]
    
    class Config:
        from_attributes = True

class AuditTrailList(BaseModel):
    total: int
    items: List[AuditTrailResponse]

# ============================================================================
# SECURITY POLICY SCHEMAS
# ============================================================================
class SecurityPolicyUpdate(BaseModel):
    risk_score_threshold_alert: Optional[float] = None
    risk_score_threshold_block: Optional[float] = None
    velocity_threshold: Optional[int] = None
    anomaly_sensitivity: Optional[str] = None
    enable_auto_block: Optional[bool] = None
    enable_geo_blocking: Optional[bool] = None

class SecurityPolicyResponse(BaseModel):
    id: UUID
    risk_score_threshold_alert: float
    risk_score_threshold_block: float
    velocity_threshold: int
    anomaly_sensitivity: str
    enable_auto_block: bool
    enable_geo_blocking: bool
    enable_ip_reputation_check: bool
    
    class Config:
        from_attributes = True

# ============================================================================
# AI FEEDBACK SCHEMAS
# ============================================================================
class AIFeedbackCreate(BaseModel):
    threat_log_id: UUID
    original_classification: str
    corrected_classification: str
    reason: Optional[str] = None

class AIFeedbackResponse(BaseModel):
    id: UUID
    threat_log_id: UUID
    original_classification: str
    corrected_classification: str
    confidence_score: float
    is_processed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# PAGINATION SCHEMAS
# ============================================================================
class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 10
    
    class Config:
        ge = 0

# ============================================================================
# ERROR RESPONSE SCHEMAS
# ============================================================================
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
