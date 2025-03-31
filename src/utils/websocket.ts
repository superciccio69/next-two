import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: HttpServer) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
}

export interface BatchUpdateMessage {
  type: string;
  batchId: string | string[];
  itemCount?: number;
  data?: {
    success?: number;
    failed?: number;
    department?: string;
    status?: string;
    errors?: number;
    processed?: number;
    total?: number;
  };
}

export function broadcastBatchUpdate(message: BatchUpdateMessage) {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

type BatchUpdate = {
  type: 'DEPARTMENT_START' | 'PROGRESS' | 'DEPARTMENT_COMPLETE' | 'BATCH_COMPLETE';
  batchId: string;
  data: any;
};

