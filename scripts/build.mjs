import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const nextCli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
const result = spawnSync(process.execPath, [nextCli, 'build'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
if (result.error) { console.error(result.error); process.exit(1); }
process.exit(result.status ?? 1);
