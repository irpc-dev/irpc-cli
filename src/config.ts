import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.irpc');
const AUTH_TOKENS_FILE = join(CONFIG_DIR, 'auth-tokens.json');

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadAll(): Record<string, string> {
  try {
    if (!existsSync(AUTH_TOKENS_FILE)) return {};
    return JSON.parse(readFileSync(AUTH_TOKENS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function loadAuthToken(subdomain: string): string | null {
  return loadAll()[subdomain] ?? null;
}

export function saveAuthToken(subdomain: string, token: string): void {
  ensureDir();
  const all = loadAll();
  all[subdomain] = token;
  writeFileSync(AUTH_TOKENS_FILE, JSON.stringify(all, null, 2), { mode: 0o600 });
}

export function clearAuthToken(subdomain: string): void {
  ensureDir();
  const all = loadAll();
  delete all[subdomain];
  writeFileSync(AUTH_TOKENS_FILE, JSON.stringify(all, null, 2), { mode: 0o600 });
}
