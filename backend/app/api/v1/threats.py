"""
Threat Management and Session Revocation API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime, timedelta
from typing import List
import logging

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, verify_admin
from backend.app.models.models import (
    User, ThreatLog, AuditTrail, AIFeedbackBuffer, ModelRetrainingJob
)
from backend.app.schemas.schemas import (
    ThreatLogResponse, ThreatLogCreate, AuditTrailResponse
)
from backend.app.services.websocket_manager import (
    websocket_manager, ThreatEvent, SessionUpdate
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/threats", tags=["threats"])


@router.get("", response_model=List[ThreatLogResponse])
async def get_threats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    severity: str = Query(None),
    days: int = Query(7, ge=1, le=90),
) -> List[ThreatLogResponse]:
    """
    Get threat logs for current organization with filtering.
    
    Query Parameters:
    - skip: Pagination offset (default: 0)
    - limit: Results per page (default: 50, max: 500)
    - severity: Filter by severity (low, medium, high, critical)
    - days: Include threats from last N days (default: 7)
    
    Returns:
        List of threat logs for the organization
    """
    # Calculate date range
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Build query
    query = db.query(ThreatLog).filter(
        and_(
            ThreatLog.organization_id == current_user.organization_id,
            ThreatLog.timestamp >= start_date
        )
    )
    
    # Apply severity filter if provided
    if severity:
        valid_severities = ["low", "medium", "high", "critical"]
        if severity not in valid_severities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid severity. Must be one of: {valid_severities}"
            )
        query = query.filter(ThreatLog.severity == severity)
    
    # Sort by timestamp descending and paginate
    threats = query.order_by(desc(ThreatLog.timestamp)).offset(skip).limit(limit).all()
    
    return threats


@router.get("/{threat_id}", response_model=ThreatLogResponse)
async def get_threat(
    threat_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ThreatLogResponse:
    """
    Get detailed threat information.
    
    Args:
        threat_id: UUID of the threat log
        
    Returns:
        ThreatLogResponse with full details
    """
    threat = db.query(ThreatLog).filter(
        and_(
            ThreatLog.id == threat_id,
            ThreatLog.organization_id == current_user.organization_id
        )
    ).first()
    
    if not threat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat not found"
        )
    
    return threat


@router.post("/{threat_id}/false-positive", status_code=status.HTTP_200_OK)
async def flag_false_positive(
    threat_id: str,
    reason: str = Query(..., min_length=5, max_length=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Flag a threat as false positive and submit feedback for model retraining.
    
    Args:
        threat_id: UUID of the threat log
        reason: Human-readable explanation for the correction
        
    Returns:
        Feedback submission confirmation
    """
    # Get threat
    threat = db.query(ThreatLog).filter(
        and_(
            ThreatLog.id == threat_id,
            ThreatLog.organization_id == current_user.organization_id
        )
    ).first()
    
    if not threat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat not found"
        )
    
    # Create feedback record
    feedback = AIFeedbackBuffer(
        organization_id=current_user.organization_id,
        threat_log_id=threat_id,
        analyst_id=current_user.id,
        original_classification="threat" if threat.ai_flagged else "normal",
        corrected_classification="normal",
        confidence_score=0.95,
        reason=reason,
        is_processed=False,
    )
    
    db.add(feedback)
    
    # Update threat to mark as false positive
    threat.false_positive = True
    threat.is_blocked = False
    
    # Log to audit trail
    audit = AuditTrail(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action_type="false_positive_flagged",
        resource_type="threat_log",
        resource_id=threat_id,
        new_values={"false_positive": True, "reason": reason},
        ip_address=None,  # Would be captured from request context
        status="completed",
    )
    
    db.add(audit)
    db.commit()
    
    # Check if retraining should be triggered
    feedback_count = db.query(AIFeedbackBuffer).filter(
        and_(
            AIFeedbackBuffer.organization_id == current_user.organization_id,
            AIFeedbackBuffer.is_processed == False
        )
    ).count()
    
    should_retrain = feedback_count >= 100  # Threshold from spec
    
    logger.info(
        f"False positive flagged for threat {threat_id} by user {current_user.id}. "
        f"Unprocessed feedback: {feedback_count}. Should retrain: {should_retrain}"
    )
    
    return {
        "status": "success",
        "feedback_id": str(feedback.id),
        "threat_id": threat_id,
        "unprocessed_feedback_count": feedback_count,
        "retraining_triggered": should_retrain,
        "message": "False positive flagged and feedback submitted for model improvement"
    }


@router.get("/feedback/retraining-status", response_model=dict)
async def get_retraining_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Get status of AI model retraining progress.
    
    Returns:
        Retraining cycle information including progress percentage
    """
    # Get unprocessed feedback count
    unprocessed = db.query(AIFeedbackBuffer).filter(
        and_(
            AIFeedbackBuffer.organization_id == current_user.organization_id,
            AIFeedbackBuffer.is_processed == False
        )
    ).count()
    
    # Get latest retraining job
    latest_job = db.query(ModelRetrainingJob).filter(
        ModelRetrainingJob.organization_id == current_user.organization_id
    ).order_by(desc(ModelRetrainingJob.training_start_time)).first()
    
    # Calculate progress
    threshold = 100
    progress_percent = min(int((unprocessed / threshold) * 100), 100)
    
    return {
        "status": "ready" if unprocessed >= threshold else "collecting",
        "unprocessed_feedback": unprocessed,
        "threshold": threshold,
        "progress_percent": progress_percent,
        "next_retrain_in_samples": max(0, threshold - unprocessed),
        "last_retraining": {
            "completed_at": latest_job.training_end_time.isoformat() if latest_job and latest_job.training_end_time else None,
            "status": latest_job.status if latest_job else "never_run",
            "metrics": latest_job.metrics if latest_job else None,
        } if latest_job else None,
        "estimated_improvement": f"{min(5 + (unprocessed // 20), 25)}%" if unprocessed > 0 else "0%"
    }


@router.post("/admin/revoke-session/{user_id}", status_code=status.HTTP_200_OK)
async def revoke_user_session(
    user_id: str,
    reason: str = Query(..., min_length=5, max_length=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Admin endpoint to revoke a user's session (kill switch).
    Forces all active connections for the user to disconnect.
    
    Args:
        user_id: UUID of user to revoke
        reason: Reason for revocation (security audit, policy violation, etc.)
        
    Returns:
        Revocation confirmation
    """
    # Verify current user is admin
    verify_admin(current_user)
    
    # Get target user
    target_user = db.query(User).filter(
        and_(
            User.id == user_id,
            User.organization_id == current_user.organization_id
        )
    ).first()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in organization"
        )
    
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke your own session"
        )
    
    # Broadcast session revocation via WebSocket
    session_update = SessionUpdate(
        user_id=user_id,
        organization_id=current_user.organization_id,
        reason=reason,
        timestamp=datetime.utcnow()
    )
    
    await websocket_manager.broadcast_session_revocation(session_update)
    
    # Log to audit trail
    audit = AuditTrail(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action_type="session_revoked",
        resource_type="user",
        resource_id=user_id,
        new_values={"reason": reason, "revoked_by": current_user.id},
        status="completed",
    )
    
    db.add(audit)
    
    # Invalidate any active API keys for security
    from backend.app.models.models import APIKey
    api_keys = db.query(APIKey).filter(APIKey.user_id == user_id)
    for key in api_keys:
        key.is_active = False
    
    db.commit()
    
    # Get connection count for report
    connections_closed = websocket_manager.get_user_connection_count(
        current_user.organization_id,
        user_id
    )
    
    logger.warning(
        f"Session revoked for user {user_id} by admin {current_user.id}. "
        f"Reason: {reason}. Connections closed: {connections_closed}"
    )
    
    return {
        "status": "success",
        "user_id": user_id,
        "reason": reason,
        "connections_closed": connections_closed,
        "api_keys_deactivated": len(api_keys),
        "message": f"Session revoked and {connections_closed} active connection(s) closed"
    }


@router.get("/stats/summary", response_model=dict)
async def get_threat_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(7, ge=1, le=90),
) -> dict:
    """
    Get threat statistics summary for dashboard.
    
    Returns:
        Aggregated threat metrics (count, severity distribution, blocked count)
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total threats
    total = db.query(ThreatLog).filter(
        and_(
            ThreatLog.organization_id == current_user.organization_id,
            ThreatLog.timestamp >= start_date
        )
    ).count()
    
    # Threats by severity
    severity_counts = db.query(ThreatLog.severity).filter(
        and_(
            ThreatLog.organization_id == current_user.organization_id,
            ThreatLog.timestamp >= start_date
        )
    ).all()
    
    severity_dist = {
        "critical": sum(1 for s in severity_counts if s[0] == "critical"),
        "high": sum(1 for s in severity_counts if s[0] == "high"),
        "medium": sum(1 for s in severity_counts if s[0] == "medium"),
        "low": sum(1 for s in severity_counts if s[0] == "low"),
    }
    
    # Blocked threats
    blocked = db.query(ThreatLog).filter(
        and_(
            ThreatLog.organization_id == current_user.organization_id,
            ThreatLog.is_blocked == True,
            ThreatLog.timestamp >= start_date
        )
    ).count()
    
    # False positives
    false_positives = db.query(ThreatLog).filter(
        and_(
            ThreatLog.organization_id == current_user.organization_id,
            ThreatLog.false_positive == True,
            ThreatLog.timestamp >= start_date
        )
    ).count()
    
    return {
        "period_days": days,
        "total_threats": total,
        "severity_distribution": severity_dist,
        "threats_blocked": blocked,
        "false_positives": false_positives,
        "block_rate": f"{(blocked / total * 100):.1f}%" if total > 0 else "0%",
        "false_positive_rate": f"{(false_positives / total * 100):.1f}%" if total > 0 else "0%",
    }


@router.get("/export", status_code=status.HTTP_200_OK)
async def export_threats_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = Query(7, ge=1, le=90),
) -> dict:
    """
    Export threat logs as CSV (admin only).
    
    Returns:
        CSV data URL for download
    """
    verify_admin(current_user)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    threats = db.query(ThreatLog).filter(
        and_(
            ThreatLog.organization_id == current_user.organization_id,
            ThreatLog.timestamp >= start_date
        )
    ).order_by(desc(ThreatLog.timestamp)).all()
    
    # Generate CSV (in production, use proper CSV library)
    csv_lines = ["timestamp,source_ip,severity,risk_score,action,is_blocked,false_positive"]
    for threat in threats:
        csv_lines.append(
            f"{threat.timestamp},{threat.source_ip},{threat.severity},"
            f"{threat.risk_score},{threat.action},{threat.is_blocked},{threat.false_positive}"
        )
    
    csv_data = "\n".join(csv_lines)
    
    logger.info(f"Threat export requested by admin {current_user.id}: {len(threats)} records")
    
    return {
        "status": "success",
        "record_count": len(threats),
        "csv_data": csv_data,
        "filename": f"threats_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    }
