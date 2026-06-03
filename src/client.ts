import WebSocket from 'ws';
import { proxyToLocal, ProxyRequest } from './proxy.js';
import { logRequest, printDisconnected, printError } from './display.js';

export interface ClientOptions {
  serverUrl: string;
  token: string;
  subdomain: string;
  localPort: number;
  onConnected: () => void;
}

const MAX_BACKOFF_MS = 30_000;

export function createTunnelClient(opts: ClientOptions): { close: () => void } {
  let ws: WebSocket | null = null;
  let reconnectAttempt = 0;
  let stopped = false;
  let reconnectTimer: NodeJS.Timeout | null = null;

  function connect() {
    const wsUrl = `${opts.serverUrl}/agent-connect?token=${encodeURIComponent(opts.token)}&subdomain=${encodeURIComponent(opts.subdomain)}`;
    ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      reconnectAttempt = 0;
      opts.onConnected();
    });

    ws.on('message', async (data: WebSocket.RawData) => {
      let payload: ProxyRequest & { correlationId: string };
      try {
        payload = JSON.parse(data.toString());
      } catch {
        printError('Received malformed message from server');
        return;
      }

      const start = Date.now();
      const response = await proxyToLocal(opts.localPort, payload);
      const durationMs = Date.now() - start;

      logRequest({
        method: payload.method,
        path: payload.path,
        status: response.status,
        durationMs,
      });

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          correlationId: payload.correlationId,
          status: response.status,
          headers: response.headers,
          body: response.body,
        }));
      }
    });

    ws.on('close', (code, reason) => {
      if (stopped) return;
      reconnectAttempt++;
      printDisconnected(reconnectAttempt);
      const backoff = Math.min(1000 * Math.pow(1.5, reconnectAttempt), MAX_BACKOFF_MS);
      reconnectTimer = setTimeout(connect, backoff);
    });

    ws.on('error', (err) => {
      printError(`WebSocket error: ${err.message}`);
    });
  }

  connect();

  return {
    close() {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}
