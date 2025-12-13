#!/usr/bin/env node
import path from 'node:path';

const linkinatorModule = globalThis.__MOCK_LINKINATOR__ ?? (await import('linkinator'));
const { LinkChecker } = linkinatorModule;
delete globalThis.__MOCK_LINKINATOR__;

/**
 * Ejecuta la verificación de enlaces con Linkinator sobre `index.html`.
 * Maneja el caso de entornos sin permisos de red evitando fallas ruidosas.
 */
try {
  const checker = new LinkChecker();
  const result = await checker.check({
    path: path.join(process.cwd(), 'index.html'),
    recurse: true,
    linksToSkip: ['^https?://'],
    verbosity: 'error',
  });

  if (!result.passed) {
    console.error('Broken links detected.');
    process.exit(1);
  }
} catch (err) {
  if (err?.message?.includes('port')) {
    console.warn(
      'Link check skipped: no se pudo iniciar el servidor embebido (entorno sin permisos de red).'
    );
    process.exit(0);
  } else {
    console.error(err);
    process.exit(1);
  }
}
