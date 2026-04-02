'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const standalone = path.join(root, '.next', 'standalone');

if (!fs.existsSync(standalone)) {
  console.warn('[postbuild-standalone] Skip: .next/standalone tidak ada.');
  process.exit(0);
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

copyIfExists(path.join(root, 'public'), path.join(standalone, 'public'));
copyIfExists(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'));
