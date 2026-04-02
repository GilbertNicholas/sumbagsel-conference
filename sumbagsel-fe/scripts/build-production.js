/**
 * Build production WAJIB pakai Webpack (bukan Turbopack default Next 16).
 * Turbopack di VPS kecil sering SIGSEGV (exit 139).
 *
 * Jalankan: npm run build  (package.json memanggil file ini)
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nextPkgDir = path.dirname(require.resolve('next/package.json'));
const nextCli = path.join(nextPkgDir, 'dist', 'bin', 'next');

if (!fs.existsSync(nextCli)) {
  console.error('[build-production] Next.js tidak ditemukan. Jalankan npm ci di folder sumbagsel-fe.');
  process.exit(1);
}

const nodeOpts = [process.env.NODE_OPTIONS, '--max-old-space-size=4096'].filter(Boolean).join(' ').trim();

const env = {
  ...process.env,
  NODE_OPTIONS: nodeOpts,
};

const build = spawnSync(process.execPath, [nextCli, 'build', '--webpack'], {
  cwd: root,
  env,
  stdio: 'inherit',
});

if (build.error) {
  console.error(build.error);
  process.exit(1);
}
if (build.signal) {
  console.error('[build-production] Build dihentikan:', build.signal);
  process.exit(1);
}
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const post = spawnSync(process.execPath, [path.join(root, 'scripts', 'postbuild-standalone.js')], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
});

process.exit(post.status ?? 0);
