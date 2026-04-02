/**
 * Entry untuk hosting (Plesk/dll) yang meminta "Application startup file" = server.js.
 * Memuat server production dari output `next.config` → output: 'standalone'.
 *
 * Wajib: jalankan `npm run build` dulu — file target dibuat di `.next/standalone/server.js`.
 */
const fs = require('fs');
const path = require('path');

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standaloneServer)) {
  console.error(
    '[sumbagsel-fe] Tidak ada .next/standalone/server.js.\n' +
      'Jalankan `npm run build` di folder ini sampai sukses, lalu start lagi.',
  );
  process.exit(1);
}

require(standaloneServer);
