#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import { createTunnelClient } from './client.js';
import { printBanner, printConnecting, printError, printSubdomainTaken, printAuthToken } from './display.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const program = new Command();

program
  .name('irpc')
  .description('irpc.dev — Expose your local server to the internet instantly')
  .version(pkg.version)
  .requiredOption('-p, --port <port>', 'Local port to expose', parseInt)
  .requiredOption('-t, --token <token>', 'Your irpc.dev API token')
  .option('-s, --subdomain <subdomain>', 'Custom subdomain (optional, auto-generated if omitted)')
  .option('-a, --auth', 'Protect the tunnel — all traffic must supply a Bearer token')
  .option('--server <url>', 'irpc server URL', 'wss://irpc.dev')
  .parse(process.argv);

const opts = program.opts<{
  port: number;
  token: string;
  subdomain?: string;
  auth?: boolean;
  server: string;
}>();

const localPort = opts.port;
const token = opts.token;
const serverUrl = opts.server;
const authEnabled = !!opts.auth;
const requestedSubdomain = opts.subdomain;
const subdomain = requestedSubdomain || generateSubdomain();

function generateSubdomain(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function httpBase(wsUrl: string): string {
  return wsUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:');
}

const tunnelUrl = serverUrl.includes('localhost')
  ? `${httpBase(serverUrl)}/t/${subdomain}`
  : `https://${subdomain}.irpc.dev`;

const localUrl = `http://localhost:${localPort}`;
const tokenPrefix = token.substring(0, 12);

async function checkSubdomain(name: string): Promise<{ available: boolean; suggestions: string[] }> {
  try {
    const base = httpBase(serverUrl);
    const res = await fetch(`${base}/api/subdomains/check?name=${encodeURIComponent(name)}`);
    const data = await res.json() as { available: boolean; suggestions?: string[] };
    return { available: data.available, suggestions: data.suggestions || [] };
  } catch {
    // if check fails (network error), proceed anyway — server will reject if taken
    return { available: true, suggestions: [] };
  }
}

async function main() {
  // Only check if the user explicitly requested a subdomain
  if (requestedSubdomain) {
    const spinner = ora({ text: `Checking subdomain "${subdomain}"...`, color: 'cyan' }).start();
    const { available, suggestions } = await checkSubdomain(subdomain);
    spinner.stop();

    if (!available) {
      printSubdomainTaken(subdomain, suggestions);
      process.exit(1);
    }
  }

  const spinner = ora({ text: `Connecting to irpc.dev...`, color: 'cyan' }).start();
  printConnecting(serverUrl);

  const client = createTunnelClient({
    serverUrl,
    token,
    subdomain,
    localPort,
    authEnabled,
    onConnected: () => {
      spinner.stop();
      printBanner(tunnelUrl, localUrl, tokenPrefix, pkg.version, authEnabled);
    },
    onAuthToken: (tunnelAuthToken: string) => {
      printAuthToken(tunnelAuthToken);
    },
  });

  process.on('SIGINT', () => {
    console.log('\n\nClosing tunnel...');
    client.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    client.close();
    process.exit(0);
  });
}

main();
