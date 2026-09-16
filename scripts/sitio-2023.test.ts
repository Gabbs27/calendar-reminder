import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

// El reto de 2023 se publica dentro del producto, en /calendar-reminder/, y sus archivos
// están versionados en public/. Esto vigila que sigan siendo exactamente los que se
// entregaron: el tag v2023-jobsity-build manda, y cualquier byte distinto pone esto rojo.
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' });

describe('el sitio de 2023 dentro del producto', () => {
  it('es, archivo por archivo, el build publicado en enero de 2023', () => {
    const arbol = git('ls-tree', '-r', 'v2023-jobsity-build').trim().split('\n');
    expect(arbol).toHaveLength(12);

    for (const linea of arbol) {
      const [meta, ruta] = linea.split('\t');
      const esperado = meta.split(/\s+/)[2];
      const real = git('hash-object', `public/calendar-reminder/${ruta}`).trim();
      expect(real, `public/calendar-reminder/${ruta}`).toBe(esperado);
    }
  });
});
