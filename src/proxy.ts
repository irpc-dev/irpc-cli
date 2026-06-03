import { fetch } from 'undici';

export interface ProxyRequest {
  method: string;
  path: string;
  query: string;
  headers: Record<string, string>;
  body: string;
}

export interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export async function proxyToLocal(localPort: number, req: ProxyRequest): Promise<ProxyResponse> {
  const url = `http://localhost:${localPort}${req.path}${req.query ? '?' + req.query : ''}`;

  const fetchHeaders: Record<string, string> = { ...req.headers };
  delete fetchHeaders['host'];
  delete fetchHeaders['connection'];

  const hasBody = req.body && req.body.length > 0 &&
    !['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(req.method.toUpperCase());

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: fetchHeaders,
      body: hasBody ? req.body : undefined,
    });

    const body = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { status: response.status, headers, body };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 502,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Local server unreachable', detail: message }),
    };
  }
}
