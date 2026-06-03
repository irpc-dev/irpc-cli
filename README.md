# irpc

The official CLI for [irpc.dev](https://irpc.dev) — expose your local server to the internet in seconds.

```
irpc.dev                                    (ctrl+c to quit)
────────────────────────────────────────────────────────────
Session Status: online
Token:          irpc_ueoVDg8…
Version:        1.0.0
Tunnel URL:     https://myapp.irpc.dev → http://localhost:3000

HTTP Requests
────────────────────────────────────────────────────────────
GET    /api/users                           200    12ms
POST   /api/auth/login                      401     8ms
```

## Install

No install required — use `npx`:

```bash
npx @irpc.dev/irpc --port 3000 --token <your-token>
```

Or install globally:

```bash
npm install -g @irpc.dev/irpc
```

## Usage

```bash
irpc --port <port> --token <token> [options]
```

### Options

| Flag | Description |
|------|-------------|
| `-p, --port <number>` | Local port to expose **(required)** |
| `-t, --token <string>` | Your irpc.dev API token **(required)** |
| `-s, --subdomain <string>` | Custom subdomain — e.g. `myapp` → `myapp.irpc.dev` |
| `--server <url>` | Custom server URL (default: `wss://irpc.dev`) |
| `-V, --version` | Print version |
| `-h, --help` | Show help |

## Examples

```bash
# Basic tunnel to port 3000
npx @irpc.dev/irpc --port 3000 --token irpc_abc123

# Custom subdomain
npx @irpc.dev/irpc --port 8080 --token irpc_abc123 --subdomain myapi

# Point at a local dev irpc server
npx @irpc.dev/irpc --port 3000 --token irpc_abc123 --server ws://localhost:5000
```

## Subdomain availability

If you request a subdomain that's already in use, the CLI exits immediately and suggests alternatives:

```
✖ Subdomain "myapp" is already in use.

  Available alternatives:
  → myapp2
  → quick-myapp
  → myapp-relay

  Try: npx @irpc.dev/irpc --port 3000 --token <token> --subdomain myapp2
```

## How it works

1. The CLI connects to irpc.dev over a WebSocket, authenticated with your API token
2. When an HTTP request hits `https://<subdomain>.irpc.dev`, the server forwards it over the WebSocket
3. The CLI proxies it to your local server and sends the response back
4. Disconnections reconnect automatically with exponential backoff

## Get a token

Sign up at [irpc.dev](https://irpc.dev), then go to **Dashboard → API Tokens → New token**.

## License

MIT — see [LICENSE](LICENSE)
