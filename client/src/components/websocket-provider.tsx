import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  joinThread: (postId: string) => void;
  leaveThread: () => void;
  sendNotification: (notification: {
    targetUserId: string;
    notificationType: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  sendMessage: () => {},
  joinThread: () => {},
  leaveThread: () => {},
  sendNotification: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
        // Server will automatically authenticate using session cookies
        // No client-side authentication message needed
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'authenticated':
              console.log("WebSocket authenticated for user:", data.userId);
              break;
              
            case 'notification':
              // Handle real-time notification
              toast({
                title: data.notification.title,
                description: data.notification.message,
              });
              
              // Invalidate notification queries to refresh the UI
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
              break;
              
            case 'post_update':
              // Invalidate post-related queries
              queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
              queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
              break;
              
            case 'thread_update':
              // Handle real-time thread updates
              if (data.postId) {
                queryClient.invalidateQueries({ queryKey: ["/api/posts", data.postId, "comments"] });
                queryClient.invalidateQueries({ queryKey: ["/api/posts", data.postId] });
                
                // Show toast for different actions if the current user didn't perform the action
                const currentPath = window.location.pathname;
                if (currentPath.includes(`/post/${data.postId}`)) {
                  switch (data.action) {
                    case 'comment_created':
                      // Don't show toast for own actions
                      break;
                    case 'reply_created':
                      // Don't show toast for own actions  
                      break;
                    case 'post_liked':
                    case 'comment_liked':
                      // Update like states without toast
                      break;
                  }
                }
              }
              break;
              
            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Cannot send message:", message);
    }
  };

  const joinThread = (postId: string) => {
    sendMessage({
      type: 'join_thread',
      postId: postId
    });
  };

  const leaveThread = () => {
    sendMessage({
      type: 'leave_thread'
    });
  };

  const sendNotification = (notification: {
    targetUserId: string;
    notificationType: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) => {
    // Notifications should be created through REST API endpoints
    // This function is deprecated for security reasons
    console.warn('sendNotification via WebSocket is deprecated. Use REST API instead.');
  };

  // Connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Handle page visibility changes to maintain connection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user?.id && !isConnected) {
        // Reconnect when page becomes visible
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user?.id, isConnected]);

  const contextValue: WebSocketContextType = {
    isConnected,
    sendMessage,
    joinThread,
    leaveThread,
    sendNotification,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
