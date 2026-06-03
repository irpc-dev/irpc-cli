import chalk from 'chalk';

export interface RequestLog {
  method: string;
  path: string;
  status: number;
  durationMs: number;
}

const SEP = '─'.repeat(60);

export function printBanner(tunnelUrl: string, localUrl: string, tokenPrefix: string, version: string) {
  console.clear();
  console.log(chalk.bold.white('\nirpc.dev') + chalk.gray('                                    (ctrl+c to quit)'));
  console.log(chalk.gray(SEP));
  console.log(chalk.gray('Session Status: ') + chalk.green('online'));
  console.log(chalk.gray('Token:          ') + chalk.white(tokenPrefix + '…'));
  console.log(chalk.gray('Version:        ') + chalk.white(version));
  console.log(chalk.gray('Tunnel URL:     ') + chalk.cyan(tunnelUrl) + chalk.gray(' → ') + chalk.white(localUrl));
  console.log('');
  console.log(chalk.bold.gray('HTTP Requests'));
  console.log(chalk.gray(SEP));
}

export function printConnecting(serverUrl: string) {
  console.log(chalk.gray('Connecting to ') + chalk.white(serverUrl) + chalk.gray('...'));
}

export function printDisconnected(attempt: number) {
  console.log(chalk.yellow(`\n⚠ Disconnected. Reconnecting... (attempt ${attempt})`));
}

export function printError(msg: string) {
  console.error(chalk.red('✖ ') + chalk.white(msg));
}

export function printSubdomainTaken(subdomain: string, suggestions: string[]) {
  console.error('');
  console.error(chalk.red('✖ ') + chalk.white(`Subdomain "${subdomain}" is already in use.`));
  console.error('');
  if (suggestions.length > 0) {
    console.error(chalk.gray('  Available alternatives:'));
    suggestions.forEach(s => {
      console.error('  ' + chalk.cyan('→') + ' ' + chalk.white(s));
    });
    console.error('');
    console.error(chalk.gray('  Try: ') + chalk.white(`npx irpc --port <port> --token <token> --subdomain ${suggestions[0]}`));
  }
  console.error('');
}

export function logRequest(log: RequestLog) {
  const method = log.method.padEnd(6);
  const path = log.path.substring(0, 40).padEnd(40);
  const duration = `${log.durationMs}ms`.padStart(6);

  let statusColor = chalk.green;
  if (log.status >= 400 && log.status < 500) statusColor = chalk.yellow;
  if (log.status >= 500) statusColor = chalk.red;

  const statusText = statusColor(String(log.status).padEnd(4));
  console.log(`${chalk.cyan(method)} ${chalk.white(path)} ${statusText} ${chalk.gray(duration)}`);
}
