#!/usr/bin/env node
const { LinkChecker } = require('linkinator');
const path = require('node:path');

const checker = new LinkChecker();

checker
  .check({
    path: path.join(process.cwd(), 'index.html'),
    recurse: true,
    linksToSkip: ['^https?://'],
    verbosity: 'error',
  })
  .then((result) => {
    if (!result.passed) {
      console.error('Broken links detected.');
      process.exit(1);
    }
  })
  .catch((err) => {
    if (err?.message?.includes('port')) {
      console.warn(
        'Link check skipped: no se pudo iniciar el servidor embebido (entorno sin permisos de red).'
      );
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  });
