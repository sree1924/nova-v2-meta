// A localhost-only test store; never write local mode into shared/production env files.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.NODE_ENV === 'production') throw new Error('Local preview is unavailable in production');
const server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '-p', '4320', '-H', '127.0.0.1'], {cwd: root, stdio: 'inherit', env: {...process.env, STORE_LOCAL_MODE: '1'}});
server.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
