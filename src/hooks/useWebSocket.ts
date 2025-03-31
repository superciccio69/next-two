import { useState, useEffect } from 'react';

interface WebSocketMessage {
  type: string;
  batchId: string;
  data?: any;
}

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        setSocket(new WebSocket(url));
      }, 5000);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  return socket;
}