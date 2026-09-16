import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// El reto de 2023 no se toca, así que la vuelta al producto vive fuera de él: esta página
// lo enmarca y pone la barra de pestañas encima. El artefacto se sigue sirviendo crudo en
// /calendar-reminder/, y esta envoltura no lo copia, lo enmarca.
const html = readFileSync('public/2023/index.html', 'utf8');

describe('la envoltura del reto de 2023', () => {
  it('enmarca el sitio servido, en vez de repetirlo', () => {
    expect(html).toMatch(/<iframe[^>]+src="\/calendar-reminder\/"/);
    expect(html).not.toMatch(/main\.4282c633\.js/);
  });

  it('lleva de vuelta al producto y dice en qué pestaña estás', () => {
    expect(html).toMatch(/href="\/"[^>]*>\s*Ahora/);
    expect(html).toMatch(/aria-current="page"/);
  });
});
