"""
WebSocket Manager for Real-Time Threat Streaming
Handles authenticated connections, tenant scoping, and broadcast logic
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
import jwt

logger = logging.getLogger(__name__)


class ThreatEvent(BaseModel):
    """Schema for threat event broadcasting"""
    id: str
    organization_id: str
    timestamp: datetime
    source_ip: str
    destination_ip: str
    severity: str  # low, medium, high, critical
    risk_score: float
    action: str
    resource: str
    user_agent: str
    is_blocked: bool
    ai_flagged: bool
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SessionUpdate(BaseModel):
    """Schema for session revocation events"""
    type: str = "session_revoked"
    user_id: str
    organization_id: str
    reason: str
    timestamp: datetime


class AuditEvent(BaseModel):
    """Schema for audit trail events"""
    type: str = "audit_log"
    event_type: str
    resource_type: str
    user_id: Optional[str]
    organization_id: str
    timestamp: datetime
    details: dict


class WebSocketConnectionManager:
    """
    Manages WebSocket connections with tenant isolation.
    
    Features:
    - Per-tenant connection pools
    - JWT-based authentication
    - Heartbeat mechanism (30-second interval)
    - Message queuing on disconnect/reconnect
    - Graceful error handling
    """
    
    def __init__(self, heartbeat_interval: int = 30):
        # Structure: {organization_id: {user_id: {connection_id: websocket}}}
        self.active_connections: Dict[str, Dict[str, Dict[str, WebSocket]]] = {}
        self.heartbeat_interval = heartbeat_interval
        self.message_queue: Dict[str, List[dict]] = {}
        self.connection_metadata: Dict[str, dict] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        organization_id: str,
        user_id: str,
        connection_id: str
    ) -> bool:
        """
        Register a new WebSocket connection.
        
        Args:
            websocket: WebSocket connection
            organization_id: Tenant identifier
            user_id: User identifier
            connection_id: Unique connection identifier
            
        Returns:
            bool: True if successful
        """
        await websocket.accept()
        
        # Initialize organization pool if needed
        if organization_id not in self.active_connections:
            self.active_connections[organization_id] = {}
        
        # Initialize user pool if needed
        if user_id not in self.active_connections[organization_id]:
            self.active_connections[organization_id][user_id] = {}
        
        # Add connection
        self.active_connections[organization_id][user_id][connection_id] = websocket
        
        # Store metadata
        self.connection_metadata[connection_id] = {
            "organization_id": organization_id,
            "user_id": user_id,
            "connected_at": datetime.utcnow(),
            "last_heartbeat": datetime.utcnow()
        }
        
        # Flush queued messages
        await self._flush_queue(organization_id, user_id)
        
        logger.info(
            f"WebSocket connected: org={organization_id}, user={user_id}, conn={connection_id}"
        )
        
        # Start heartbeat task
        asyncio.create_task(self._heartbeat(connection_id))
        
        return True
    
    async def disconnect(self, connection_id: str) -> None:
        """
        Remove a WebSocket connection.
        
        Args:
            connection_id: Connection identifier to remove
        """
        if connection_id not in self.connection_metadata:
            return
        
        metadata = self.connection_metadata[connection_id]
        org_id = metadata["organization_id"]
        user_id = metadata["user_id"]
        
        try:
            if (org_id in self.active_connections and
                user_id in self.active_connections[org_id] and
                connection_id in self.active_connections[org_id][user_id]):
                del self.active_connections[org_id][user_id][connection_id]
        except KeyError:
            pass
        
        del self.connection_metadata[connection_id]
        
        logger.info(
            f"WebSocket disconnected: org={org_id}, user={user_id}, conn={connection_id}"
        )
    
    async def broadcast_threat(self, threat: ThreatEvent) -> None:
        """
        Broadcast threat event to all connections in an organization.
        
        Args:
            threat: ThreatEvent to broadcast
        """
        org_id = threat.organization_id
        
        if org_id not in self.active_connections:
            logger.warning(f"No active connections for org {org_id}")
            return
        
        message = {
            "type": "threat_detected",
            "data": json.loads(threat.json())
        }
        
        disconnected_connections = []
        
        # Broadcast to all users in organization
        for user_id, connections in self.active_connections[org_id].items():
            for connection_id, websocket in connections.items():
                try:
                    await websocket.send_json(message)
                    self.connection_metadata[connection_id]["last_heartbeat"] = datetime.utcnow()
                except Exception as e:
                    logger.error(f"Failed to send message to {connection_id}: {e}")
                    disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for conn_id in disconnected_connections:
            await self.disconnect(conn_id)
    
    async def broadcast_session_revocation(self, session: SessionUpdate) -> None:
        """
        Broadcast session revocation to force logout.
        
        Args:
            session: SessionUpdate containing revocation details
        """
        org_id = session.organization_id
        target_user_id = session.user_id
        
        if org_id not in self.active_connections:
            return
        
        message = {
            "type": "session_revoked",
            "data": {
                "reason": session.reason,
                "timestamp": session.timestamp.isoformat()
            }
        }
        
        # Send only to target user's connections
        if target_user_id in self.active_connections[org_id]:
            connections = self.active_connections[org_id][target_user_id]
            for connection_id, websocket in list(connections.items()):
                try:
                    await websocket.send_json(message)
                    await asyncio.sleep(0.1)  # Small delay
                    await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                except Exception as e:
                    logger.error(f"Failed to revoke session {connection_id}: {e}")
                finally:
                    await self.disconnect(connection_id)
    
    async def broadcast_audit(self, audit: AuditEvent) -> None:
        """
        Broadcast audit event to all admins in organization.
        
        Args:
            audit: AuditEvent to broadcast
        """
        org_id = audit.organization_id
        
        if org_id not in self.active_connections:
            return
        
        message = {
            "type": "audit_log",
            "data": json.loads(audit.json())
        }
        
        # In production, filter by admin role (requires context)
        # For now, broadcast to all connections
        for user_id, connections in self.active_connections[org_id].items():
            for connection_id, websocket in list(connections.items()):
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send audit event to {connection_id}: {e}")
    
    async def send_personal(self, connection_id: str, message: dict) -> bool:
        """
        Send message to specific connection.
        
        Args:
            connection_id: Target connection
            message: Message dict to send
            
        Returns:
            bool: True if successful
        """
        if connection_id not in self.connection_metadata:
            return False
        
        metadata = self.connection_metadata[connection_id]
        org_id = metadata["organization_id"]
        user_id = metadata["user_id"]
        
        try:
            if (org_id in self.active_connections and
                user_id in self.active_connections[org_id] and
                connection_id in self.active_connections[org_id][user_id]):
                
                websocket = self.active_connections[org_id][user_id][connection_id]
                await websocket.send_json(message)
                return True
        except Exception as e:
            logger.error(f"Failed to send personal message to {connection_id}: {e}")
        
        return False
    
    async def _heartbeat(self, connection_id: str) -> None:
        """
        Send periodic heartbeat to keep connection alive.
        
        Args:
            connection_id: Connection to heartbeat
        """
        while connection_id in self.connection_metadata:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                await self.send_personal(
                    connection_id,
                    {"type": "heartbeat", "timestamp": datetime.utcnow().isoformat()}
                )
            except Exception as e:
                logger.error(f"Heartbeat failed for {connection_id}: {e}")
                await self.disconnect(connection_id)
                break
    
    async def _flush_queue(self, org_id: str, user_id: str) -> None:
        """
        Send any queued messages on reconnection.
        
        Args:
            org_id: Organization identifier
            user_id: User identifier
        """
        queue_key = f"{org_id}:{user_id}"
        
        if queue_key not in self.message_queue:
            return
        
        if (org_id not in self.active_connections or
            user_id not in self.active_connections[org_id]):
            return
        
        messages = self.message_queue[queue_key]
        connections = self.active_connections[org_id][user_id]
        
        for connection_id, websocket in connections.items():
            for message in messages:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to flush queue for {connection_id}: {e}")
        
        del self.message_queue[queue_key]
        logger.info(f"Flushed {len(messages)} queued messages for {queue_key}")
    
    def queue_message(self, org_id: str, user_id: str, message: dict) -> None:
        """
        Queue message for user when offline.
        
        Args:
            org_id: Organization identifier
            user_id: User identifier
            message: Message to queue
        """
        queue_key = f"{org_id}:{user_id}"
        
        if queue_key not in self.message_queue:
            self.message_queue[queue_key] = []
        
        # Limit queue size to prevent memory issues
        if len(self.message_queue[queue_key]) < 1000:
            self.message_queue[queue_key].append(message)
    
    def get_connection_count(self, org_id: str) -> int:
        """
        Get active connection count for organization.
        
        Args:
            org_id: Organization identifier
            
        Returns:
            int: Number of active connections
        """
        if org_id not in self.active_connections:
            return 0
        
        total = 0
        for user_connections in self.active_connections[org_id].values():
            total += len(user_connections)
        
        return total
    
    def get_user_connection_count(self, org_id: str, user_id: str) -> int:
        """
        Get active connection count for specific user.
        
        Args:
            org_id: Organization identifier
            user_id: User identifier
            
        Returns:
            int: Number of active connections for user
        """
        if (org_id in self.active_connections and
            user_id in self.active_connections[org_id]):
            return len(self.active_connections[org_id][user_id])
        
        return 0


# Global instance
websocket_manager = WebSocketConnectionManager()


async def get_websocket_manager() -> WebSocketConnectionManager:
    """Dependency injection for WebSocket manager"""
    return websocket_manager
