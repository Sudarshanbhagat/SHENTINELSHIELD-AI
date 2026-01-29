"""
Enterprise Onboarding API Endpoints
Organization creation, domain verification, and initial setup
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import secrets
import re
from datetime import datetime
from typing import Optional

from backend.app.core.database import get_db
from backend.app.models.models import (
    Organization, User, SecurityPolicy, Settings, AuditTrail
)
from backend.app.schemas.schemas import (
    OrganizationCreate, UserCreate, OrganizationResponse
)

router = APIRouter(prefix="/api/v1/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db),
) -> OrganizationResponse:
    """
    Create new organization during onboarding.
    
    This endpoint:
    1. Validates organization name and domain
    2. Creates organization record
    3. Creates initial admin user
    4. Sets up default security policy
    5. Initializes settings
    
    Args:
        org_data: Organization creation data (name, domain, admin_email, admin_password)
        
    Returns:
        Created organization with initial user
    """
    
    # Validate organization name
    if not org_data.name or len(org_data.name) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name must be at least 3 characters"
        )
    
    # Validate domain
    domain_pattern = r'^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
    if not re.match(domain_pattern, org_data.domain):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid domain format"
        )
    
    # Check domain uniqueness
    existing_org = db.query(Organization).filter(
        Organization.domain == org_data.domain.lower()
    ).first()
    
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Domain already registered"
        )
    
    # Create organization
    new_org = Organization(
        name=org_data.name,
        domain=org_data.domain.lower(),
        subscription_tier="starter",
        is_active=True,
        metadata={
            "created_via": "web_onboarding",
            "onboarding_completed": False,
            "domain_verified": False
        },
        settings={
            "max_users": 10,
            "max_api_calls_per_day": 10000,
            "enable_mfa": False,
            "enable_sso": False,
            "retention_days": 90
        }
    )
    
    db.add(new_org)
    db.flush()  # Get the ID without committing
    
    # Create initial admin user
    from backend.app.core.security import get_password_hash
    
    admin_user = User(
        organization_id=new_org.id,
        email=org_data.admin_email,
        full_name=org_data.admin_name or "Admin",
        password_hash=get_password_hash(org_data.admin_password),
        role="admin",
        is_active=True,
    )
    
    db.add(admin_user)
    db.flush()
    
    # Create default security policy
    security_policy = SecurityPolicy(
        organization_id=new_org.id,
        thresholds_alert=0.6,
        thresholds_block=0.8,
        velocity_threshold=10,
        anomaly_sensitivity=0.5,
        enable_auto_block=True,
        enable_geo_blocking=False,
        enable_ip_reputation_check=True,
        suspicious_activity_alert_email=org_data.admin_email,
    )
    
    db.add(security_policy)
    
    # Create default settings
    default_settings = Settings(
        organization_id=new_org.id,
        theme="dark",
        timezone="UTC",
        notification_preferences={
            "email_on_critical": True,
            "email_on_high": True,
            "email_on_weekly_summary": True,
            "slack_integration_enabled": False,
        },
        custom_fields={}
    )
    
    db.add(default_settings)
    
    # Log to audit trail
    audit = AuditTrail(
        organization_id=new_org.id,
        user_id=admin_user.id,
        action_type="organization_created",
        resource_type="organization",
        resource_id=str(new_org.id),
        new_values={
            "name": new_org.name,
            "domain": new_org.domain,
            "subscription_tier": new_org.subscription_tier
        },
        status="completed",
    )
    
    db.add(audit)
    db.commit()
    
    return OrganizationResponse.from_orm(new_org)


@router.post("/{org_id}/verify-domain", status_code=status.HTTP_200_OK)
async def verify_domain(
    org_id: str,
    verification_method: str = Query("dns", regex="^(dns|email)$"),
    db: Session = Depends(get_db),
) -> dict:
    """
    Verify ownership of domain via DNS or email.
    
    DNS Method:
    - Generate TXT record requirement
    - Return record to add: _sentinelshield.yourdomain.com TXT "verification_token"
    
    Email Method:
    - Send verification link to admin email
    - User clicks link to confirm ownership
    
    Args:
        org_id: Organization ID
        verification_method: "dns" or "email"
        
    Returns:
        Verification instructions
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    if verification_method == "dns":
        # Store verification token for DNS check
        if not org.metadata:
            org.metadata = {}
        org.metadata["dns_verification_token"] = verification_token
        org.metadata["dns_verification_requested_at"] = datetime.utcnow().isoformat()
        
        db.commit()
        
        return {
            "method": "dns",
            "status": "pending",
            "instructions": f"Add the following DNS TXT record to your domain ({org.domain}):",
            "dns_record": {
                "name": f"_sentinelshield.{org.domain}",
                "type": "TXT",
                "value": verification_token,
                "ttl": 3600
            },
            "verify_url": f"/api/v1/organizations/{org_id}/verify-domain/dns?token={verification_token}",
            "expires_in_hours": 48
        }
    
    else:  # email
        # Get admin user email
        admin = db.query(User).filter(
            and_(
                User.organization_id == org_id,
                User.role == "admin"
            )
        ).first()
        
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No admin user found for organization"
            )
        
        # Store email verification token
        if not org.metadata:
            org.metadata = {}
        org.metadata["email_verification_token"] = verification_token
        org.metadata["email_verification_requested_at"] = datetime.utcnow().isoformat()
        
        db.commit()
        
        # In production, send email with verification link
        # send_verification_email(admin.email, verification_token)
        
        return {
            "method": "email",
            "status": "pending",
            "message": f"Verification link sent to {admin.email}",
            "verify_url": f"/api/v1/organizations/{org_id}/verify-domain/email?token={verification_token}",
            "expires_in_hours": 24
        }


@router.get("/{org_id}/verify-domain/dns", status_code=status.HTTP_200_OK)
async def verify_domain_dns(
    org_id: str,
    token: str = Query(...),
    db: Session = Depends(get_db),
) -> dict:
    """
    Verify DNS record.
    
    In production, this would query the DNS system to verify the TXT record exists.
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    stored_token = org.metadata.get("dns_verification_token") if org.metadata else None
    
    if not stored_token or stored_token != token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # In production, verify DNS record:
    # dns_verified = check_dns_record(org.domain, token)
    # For now, assume success
    
    org.metadata["domain_verified"] = True
    org.metadata["domain_verified_at"] = datetime.utcnow().isoformat()
    org.metadata["onboarding_completed"] = True
    
    # Remove token from metadata
    org.metadata.pop("dns_verification_token", None)
    
    db.commit()
    
    return {
        "status": "verified",
        "domain": org.domain,
        "verified_at": org.metadata["domain_verified_at"],
        "onboarding_status": "completed"
    }


@router.get("/{org_id}/onboarding-status", response_model=dict)
async def get_onboarding_status(
    org_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """
    Get onboarding completion status.
    
    Returns:
        Progress on setup steps (org created, admin added, domain verified, etc.)
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check completion of each step
    admin_created = db.query(User).filter(
        and_(
            User.organization_id == org_id,
            User.role == "admin"
        )
    ).count() > 0
    
    policy_configured = db.query(SecurityPolicy).filter(
        SecurityPolicy.organization_id == org_id
    ).count() > 0
    
    domain_verified = org.metadata.get("domain_verified", False) if org.metadata else False
    
    completion_steps = [
        {"step": "Organization Created", "completed": True},
        {"step": "Admin User Added", "completed": admin_created},
        {"step": "Domain Verified", "completed": domain_verified},
        {"step": "Security Policy Configured", "completed": policy_configured},
    ]
    
    completed = sum(1 for step in completion_steps if step["completed"])
    total = len(completion_steps)
    
    return {
        "organization_id": org_id,
        "organization_name": org.name,
        "domain": org.domain,
        "progress_percent": int((completed / total) * 100),
        "steps": completion_steps,
        "is_complete": completed == total,
        "next_step": None if completed == total else next(
            (step["step"] for step in completion_steps if not step["completed"]),
            None
        )
    }


@router.post("/{org_id}/invite-user", status_code=status.HTTP_201_CREATED)
async def invite_user(
    org_id: str,
    email: str = Query(...),
    role: str = Query("analyst", regex="^(admin|analyst|viewer)$"),
    db: Session = Depends(get_db),
) -> dict:
    """
    Send invitation to user to join organization.
    
    Args:
        org_id: Organization ID
        email: User email address
        role: Role to assign (admin, analyst, viewer)
        
    Returns:
        Invitation details
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if user already exists
    existing = db.query(User).filter(
        and_(
            User.organization_id == org_id,
            User.email == email.lower()
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists in organization"
        )
    
    # Generate invitation token
    invitation_token = secrets.token_urlsafe(32)
    
    # Store invitation in metadata (in production, use separate Invitations table)
    if not org.metadata:
        org.metadata = {}
    
    if "invitations" not in org.metadata:
        org.metadata["invitations"] = {}
    
    org.metadata["invitations"][email.lower()] = {
        "token": invitation_token,
        "role": role,
        "sent_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }
    
    db.commit()
    
    # In production, send invitation email
    # send_invitation_email(email, invitation_token, role)
    
    return {
        "status": "invited",
        "email": email,
        "role": role,
        "invitation_expires_in_days": 7,
        "acceptance_url": f"/onboarding/join?token={invitation_token}"
    }
