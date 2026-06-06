import { request } from 'undici';

export interface ProxyRequest {
  method: string;
  path: string;
  query: string;
  headers: Record<string, string>;
  body: string;
}

export async function proxyToLocalStreaming(
  localPort: number,
  req: ProxyRequest,
  onStart: (status: number, headers: Record<string, string>) => void,
  onChunk: (chunk: Buffer) => void,
  onEnd: () => void,
): Promise<void> {
  const url = `http://localhost:${localPort}${req.path}${req.query ? '?' + req.query : ''}`;

  const upstreamHeaders: Record<string, string> = { ...req.headers };
  delete upstreamHeaders['host'];
  delete upstreamHeaders['connection'];
  delete upstreamHeaders['transfer-encoding'];

  const hasBody = !!req.body && req.body.length > 0 &&
    !['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(req.method.toUpperCase());

  try {
    const { statusCode, headers, body } = await request(url, {
      method: req.method as any,
      headers: upstreamHeaders,
      body: hasBody ? req.body : undefined,
    });

    const respHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        respHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    }

    onStart(statusCode, respHeaders);

    for await (const chunk of body) {
      onChunk(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
    }

    onEnd();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    onStart(502, { 'content-type': 'application/json' });
    onChunk(Buffer.from(JSON.stringify({ error: 'Local server unreachable', detail: message })));
    onEnd();
  }
}
