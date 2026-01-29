-- SentinelShield AI (v2.0) - PostgreSQL Database Schema
-- Multi-tenant architecture with Row-Level Security (RLS)

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. ORGANIZATIONS TABLE (Tenant Metadata)
-- ============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}',
    -- Custom security policies
    max_users INTEGER NOT NULL DEFAULT 10,
    max_api_calls_per_day INTEGER NOT NULL DEFAULT 10000,
    enable_mfa BOOLEAN NOT NULL DEFAULT FALSE,
    enable_sso BOOLEAN NOT NULL DEFAULT FALSE,
    retention_days INTEGER NOT NULL DEFAULT 90
);

CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- ============================================================================
-- 3. USERS TABLE (RBAC-enabled)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- admin, analyst, viewer
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(organization_id, role);

-- ============================================================================
-- 4. THREAT_LOGS TABLE (Raw Event Data)
-- ============================================================================
CREATE TABLE threat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_ip INET NOT NULL,
    destination_ip INET,
    user_id VARCHAR(255),
    user_agent TEXT,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    method VARCHAR(10), -- GET, POST, DELETE, etc.
    status_code INTEGER,
    response_time_ms INTEGER,
    anomaly_score FLOAT DEFAULT 0.0,
    risk_score FLOAT DEFAULT 0.0,
    severity VARCHAR(50) DEFAULT 'low', -- low, medium, high, critical
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    ai_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    false_positive BOOLEAN,
    raw_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_threat_logs_org_timestamp ON threat_logs(organization_id, timestamp DESC);
CREATE INDEX idx_threat_logs_severity ON threat_logs(organization_id, severity);
CREATE INDEX idx_threat_logs_source_ip ON threat_logs(source_ip);
CREATE INDEX idx_threat_logs_ai_flagged ON threat_logs(organization_id, ai_flagged);
CREATE INDEX idx_threat_logs_created_at ON threat_logs(created_at DESC);

-- ============================================================================
-- 5. AUDIT_TRAILS TABLE (Immutable Compliance Records)
-- ============================================================================
CREATE TABLE audit_trails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(255) NOT NULL, -- user_login, policy_change, org_update, etc.
    resource_type VARCHAR(255) NOT NULL, -- organization, policy, user, etc.
    resource_id VARCHAR(255),
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'success', -- success, failure
    error_message TEXT,
    -- Cryptographic integrity
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the record
    previous_hash VARCHAR(64), -- Chain for integrity verification
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on organization_id and timestamp for compliance queries
CREATE INDEX idx_audit_trails_org_timestamp ON audit_trails(organization_id, created_at DESC);
CREATE INDEX idx_audit_trails_action_type ON audit_trails(organization_id, action_type);
CREATE INDEX idx_audit_trails_user_id ON audit_trails(user_id);

-- Make audit_trails immutable (prevent updates and deletes)
CREATE RULE audit_trails_no_update AS ON UPDATE TO audit_trails DO INSTEAD NOTHING;
CREATE RULE audit_trails_no_delete AS ON DELETE TO audit_trails DO INSTEAD NOTHING;

-- ============================================================================
-- 6. AI_FEEDBACK_BUFFER TABLE (HITL Feedback for Model Retraining)
-- ============================================================================
CREATE TABLE ai_feedback_buffer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    threat_log_id UUID REFERENCES threat_logs(id) ON DELETE CASCADE,
    analyst_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    original_classification VARCHAR(50) NOT NULL, -- threat, anomaly, normal
    corrected_classification VARCHAR(50) NOT NULL, -- threat, anomaly, normal
    confidence_score FLOAT DEFAULT 0.0,
    reason TEXT,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_buffer_org_processed ON ai_feedback_buffer(organization_id, is_processed);
CREATE INDEX idx_feedback_buffer_analyst ON ai_feedback_buffer(analyst_id);
CREATE INDEX idx_feedback_buffer_created_at ON ai_feedback_buffer(created_at DESC);

-- ============================================================================
-- 7. SECURITY_POLICIES TABLE (Customizable Tenant Policies)
-- ============================================================================
CREATE TABLE security_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    risk_score_threshold_alert FLOAT NOT NULL DEFAULT 0.6,
    risk_score_threshold_block FLOAT NOT NULL DEFAULT 0.8,
    velocity_threshold INTEGER NOT NULL DEFAULT 5, -- actions per minute
    anomaly_sensitivity VARCHAR(50) NOT NULL DEFAULT 'medium', -- low, medium, high
    enable_auto_block BOOLEAN NOT NULL DEFAULT FALSE,
    enable_geo_blocking BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_countries TEXT, -- JSON array of country codes
    enable_ip_reputation_check BOOLEAN NOT NULL DEFAULT TRUE,
    suspicious_activity_alert_email BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_policies_org_id ON security_policies(organization_id);

-- ============================================================================
-- 8. MODEL_RETRAINING_JOBS TABLE (ML Pipeline Tracking)
-- ============================================================================
CREATE TABLE model_retraining_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_type VARCHAR(100) NOT NULL, -- isolation_forest, pytorch_model, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    feedback_count INTEGER NOT NULL DEFAULT 0,
    training_start_time TIMESTAMP WITH TIME ZONE,
    training_end_time TIMESTAMP WITH TIME ZONE,
    model_accuracy FLOAT,
    precision FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    error_message TEXT,
    model_version VARCHAR(50),
    is_deployed BOOLEAN NOT NULL DEFAULT FALSE,
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_model_jobs_org_status ON model_retraining_jobs(organization_id, status);
CREATE INDEX idx_model_jobs_created_at ON model_retraining_jobs(created_at DESC);

-- ============================================================================
-- 9. API_KEYS TABLE (API Authentication)
-- ============================================================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL, -- For display purposes
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================================
-- 10. SETTINGS TABLE (Tenant Custom Settings)
-- ============================================================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    theme VARCHAR(50) DEFAULT 'dark',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB NOT NULL DEFAULT '{}',
    custom_fields JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback_buffer ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_retraining_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Function to get current organization ID from JWT token
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('app.current_org_id')::UUID,
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- Users RLS Policy: Users can only see users in their organization
CREATE POLICY users_org_isolation ON users
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- Threat Logs RLS Policy: Users can only see threat logs for their organization
CREATE POLICY threat_logs_org_isolation ON threat_logs
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- Audit Trails RLS Policy: Users can only see audit trails for their organization
CREATE POLICY audit_trails_org_isolation ON audit_trails
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- AI Feedback Buffer RLS Policy
CREATE POLICY feedback_buffer_org_isolation ON ai_feedback_buffer
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- Security Policies RLS Policy
CREATE POLICY security_policies_org_isolation ON security_policies
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- API Keys RLS Policy
CREATE POLICY api_keys_org_isolation ON api_keys
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- Settings RLS Policy
CREATE POLICY settings_org_isolation ON settings
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- Model Retraining Jobs RLS Policy
CREATE POLICY model_jobs_org_isolation ON model_retraining_jobs
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- Organizations RLS Policy: Users can only see their own organization
CREATE POLICY organizations_view ON organizations
  USING (id = current_org_id());

-- ============================================================================
-- TRIGGERS FOR AUDIT TRAIL AND UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to organizations
CREATE TRIGGER organizations_update_timestamp
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Apply timestamp trigger to security_policies
CREATE TRIGGER security_policies_update_timestamp
  BEFORE UPDATE ON security_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Apply timestamp trigger to users
CREATE TRIGGER users_update_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Apply timestamp trigger to settings
CREATE TRIGGER settings_update_timestamp
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Function to compute content hash for audit trails
CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
  content TEXT;
BEGIN
  -- Create content string from the audit trail data
  content := format(
    '%s|%s|%s|%s|%s|%s|%s',
    NEW.organization_id,
    NEW.action_type,
    NEW.resource_type,
    COALESCE(NEW.resource_id, ''),
    COALESCE(NEW.new_values::text, ''),
    COALESCE(NEW.ip_address::text, ''),
    NEW.created_at
  );
  
  -- Compute SHA-256 hash
  NEW.content_hash := encode(digest(content, 'sha256'), 'hex');
  
  -- Get previous hash if this is a chain
  SELECT content_hash INTO NEW.previous_hash
  FROM audit_trails
  WHERE organization_id = NEW.organization_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply hash trigger to audit_trails
CREATE TRIGGER audit_trails_compute_hash
  BEFORE INSERT ON audit_trails
  FOR EACH ROW
  EXECUTE FUNCTION compute_audit_hash();

-- ============================================================================
-- SAMPLE DATA (Optional - remove in production)
-- ============================================================================

-- Insert sample organization
INSERT INTO organizations (name, domain, subscription_tier, max_users, enable_mfa)
VALUES (
  'Acme Corp',
  'acme.com',
  'professional',
  50,
  TRUE
) ON CONFLICT (domain) DO NOTHING;

-- Insert sample admin user
INSERT INTO users (organization_id, email, full_name, password_hash, role, mfa_enabled)
SELECT id, 'admin@acme.com', 'Admin User', crypt('admin_password_123', gen_salt('bf')), 'admin', FALSE
FROM organizations
WHERE domain = 'acme.com'
ON CONFLICT (organization_id, email) DO NOTHING;

-- Create default security policy
INSERT INTO security_policies (organization_id, risk_score_threshold_alert, risk_score_threshold_block)
SELECT id, 0.6, 0.8
FROM organizations
WHERE domain = 'acme.com'
ON CONFLICT (organization_id) DO NOTHING;

-- Create default settings
INSERT INTO settings (organization_id, theme, timezone)
SELECT id, 'dark', 'UTC'
FROM organizations
WHERE domain = 'acme.com'
ON CONFLICT (organization_id) DO NOTHING;

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE organizations IS 'Stores multi-tenant organization metadata and subscription information';
COMMENT ON TABLE users IS 'Stores user accounts with RBAC roles: admin, analyst, viewer';
COMMENT ON TABLE threat_logs IS 'Raw security event logs with AI risk scoring and anomaly detection results';
COMMENT ON TABLE audit_trails IS 'Immutable compliance audit trail with cryptographic integrity hashing';
COMMENT ON TABLE ai_feedback_buffer IS 'Stores analyst corrections to AI classifications for model retraining';
COMMENT ON TABLE security_policies IS 'Customizable threat detection policies per organization';
COMMENT ON TABLE model_retraining_jobs IS 'Tracks ML model retraining jobs and deployments';
COMMENT ON TABLE api_keys IS 'API authentication keys for programmatic access';

COMMENT ON COLUMN threat_logs.anomaly_score IS 'Isolation Forest anomaly detection score (0-1)';
COMMENT ON COLUMN threat_logs.risk_score IS 'Combined risk score = (anomaly_score * 0.6) + (velocity_weight * 0.4)';
COMMENT ON COLUMN audit_trails.content_hash IS 'SHA-256 hash of record for integrity verification';
COMMENT ON COLUMN audit_trails.previous_hash IS 'Reference to previous record hash for chain integrity';
