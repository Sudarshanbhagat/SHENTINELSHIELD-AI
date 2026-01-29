/**
 * Custom React Hook for WebSocket Management
 * Handles connection lifecycle, reconnection, heartbeat, and message queuing
 * 
 * Usage:
 * const { socket, isConnected, lastMessage, send } = useSocket();
 * 
 * useEffect(() => {
 *   if (lastMessage?.type === 'threat_detected') {
 *     handleNewThreat(lastMessage.data);
 *   }
 * }, [lastMessage]);
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useTenantStore } from '@/lib/stores/tenant';

interface SocketMessage {
  type: 'threat_detected' | 'session_revoked' | 'audit_log' | 'heartbeat';
  data?: any;
  timestamp?: string;
}

interface SocketHookReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  lastMessage: SocketMessage | null;
  send: (message: any) => void;
  disconnect: () => void;
  messageQueue: SocketMessage[];
}

const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

export const useSocket = (): SocketHookReturn => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<SocketMessage[]>([]);

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  const [messageQueue, setMessageQueue] = useState<SocketMessage[]>([]);

  const { token } = useAuthStore();
  const { tenantId, userId } = useTenantStore();

  // Get WebSocket URL from environment
  const getSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000';
    return `${protocol}//${host}/api/v1/ws/${tenantId}/${userId}?token=${token}`;
  }, [tenantId, userId, token]);

  // Clear heartbeat timeout
  const clearHeartbeatTimeout = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Set heartbeat timeout to detect stale connection
  const setHeartbeatTimeout = useCallback(() => {
    clearHeartbeatTimeout();
    
    heartbeatTimeoutRef.current = setTimeout(() => {
      console.warn('WebSocket heartbeat timeout - closing connection');
      if (socketRef.current) {
        socketRef.current.close(1006, 'Heartbeat timeout');
      }
    }, HEARTBEAT_TIMEOUT);
  }, [clearHeartbeatTimeout]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: SocketMessage = JSON.parse(event.data);

      // Reset heartbeat on any message
      setHeartbeatTimeout();

      // Handle different message types
      switch (message.type) {
        case 'threat_detected':
          setLastMessage(message);
          messageQueueRef.current.push(message);
          setMessageQueue([...messageQueueRef.current]);
          break;

        case 'session_revoked':
          console.warn('Session revoked by admin:', message.data?.reason);
          setLastMessage(message);
          // Clear auth and redirect to login
          useAuthStore.getState().logout();
          window.location.href = '/login';
          break;

        case 'audit_log':
          setLastMessage(message);
          messageQueueRef.current.push(message);
          setMessageQueue([...messageQueueRef.current]);
          break;

        case 'heartbeat':
          // Heartbeat received, connection is healthy
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [setHeartbeatTimeout]);

  // Handle WebSocket open
  const handleOpen = useCallback(() => {
    console.log('WebSocket connected');
    setIsConnected(true);
    setIsReconnecting(false);
    reconnectAttemptsRef.current = 0;
    setHeartbeatTimeout();

    // Notify server of connection
    if (socketRef.current) {
      socketRef.current.send(
        JSON.stringify({
          type: 'connection_established',
          tenantId,
          userId,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, [tenantId, userId, setHeartbeatTimeout]);

  // Handle WebSocket error
  const handleError = useCallback((event: Event) => {
    console.error('WebSocket error:', event);
    setIsConnected(false);
  }, []);

  // Handle WebSocket close
  const handleClose = useCallback(() => {
    console.log('WebSocket disconnected');
    setIsConnected(false);
    clearHeartbeatTimeout();

    // Attempt reconnection
    if (reconnectAttemptsRef.current < RECONNECT_ATTEMPTS && token) {
      setIsReconnecting(true);
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(
          `Attempting to reconnect (${reconnectAttemptsRef.current + 1}/${RECONNECT_ATTEMPTS})`
        );
        reconnectAttemptsRef.current += 1;
        connect();
      }, RECONNECT_DELAY);
    } else if (reconnectAttemptsRef.current >= RECONNECT_ATTEMPTS) {
      console.error(
        'Failed to reconnect after',
        RECONNECT_ATTEMPTS,
        'attempts'
      );
      setIsReconnecting(false);
    }
  }, [token, clearHeartbeatTimeout]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!token || !tenantId || !userId) {
      console.warn('Missing required auth context for WebSocket connection');
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const url = getSocketUrl();
      console.log('Connecting to WebSocket...');
      
      socketRef.current = new WebSocket(url);
      socketRef.current.onopen = handleOpen;
      socketRef.current.onmessage = handleMessage;
      socketRef.current.onerror = handleError;
      socketRef.current.onclose = handleClose;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnected(false);
    }
  }, [token, tenantId, userId, getSocketUrl, handleOpen, handleMessage, handleError, handleClose]);

  // Send message through WebSocket
  const send = useCallback(
    (message: any) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket not connected, queuing message');
        messageQueueRef.current.push(message);
        setMessageQueue([...messageQueueRef.current]);
      }
    },
    []
  );

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    clearHeartbeatTimeout();

    if (socketRef.current) {
      socketRef.current.close(1000, 'User initiated disconnect');
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsReconnecting(false);
  }, [clearHeartbeatTimeout]);

  // Effect: Connect on mount and when auth context changes
  useEffect(() => {
    if (token && tenantId && userId) {
      connect();
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
      // Only clear heartbeat timeout
      clearHeartbeatTimeout();
    };
  }, [token, tenantId, userId, connect, clearHeartbeatTimeout]);

  // Effect: Handle session revocation
  useEffect(() => {
    if (lastMessage?.type === 'session_revoked') {
      disconnect();
    }
  }, [lastMessage, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    lastMessage,
    send,
    disconnect,
    messageQueue,
  };
};

/**
 * Custom hook for specific message type subscription
 * 
 * Usage:
 * const threats = useSocketMessages('threat_detected');
 */
export const useSocketMessages = (messageType: SocketMessage['type']) => {
  const { lastMessage, messageQueue } = useSocket();

  const messages = messageQueue.filter((msg) => msg.type === messageType);

  return {
    lastMessage: lastMessage?.type === messageType ? lastMessage : null,
    allMessages: messages,
    count: messages.length,
  };
};

/**
 * Custom hook for listening to threat events
 * 
 * Usage:
 * const { threat, isNew } = useThreatSocket();
 */
export const useThreatSocket = () => {
  const { lastMessage } = useSocket();

  return {
    threat: lastMessage?.type === 'threat_detected' ? lastMessage.data : null,
    isNew: lastMessage?.type === 'threat_detected',
    timestamp: lastMessage?.timestamp || null,
  };
};

/**
 * Custom hook for session events
 * 
 * Usage:
 * const { isRevoked, reason } = useSessionSocket();
 */
export const useSessionSocket = () => {
  const { lastMessage } = useSocket();

  return {
    isRevoked: lastMessage?.type === 'session_revoked',
    reason: lastMessage?.type === 'session_revoked' ? lastMessage.data?.reason : null,
    timestamp: lastMessage?.timestamp || null,
  };
};
