import { describe, it, expect } from 'vitest';
import { estadoVentana } from './ventana';

const hoy = '2026-09-14';

describe('ventana de pronóstico', () => {
  it('los bordes observados están dentro', () => {
    expect(estadoVentana('2026-09-30', hoy)).toEqual({ tipo: 'disponible' });
    expect(estadoVentana('2026-06-14', hoy)).toEqual({ tipo: 'disponible' });
  });

  it('un día después del borde futuro dice desde cuándo habrá pronóstico', () => {
    expect(estadoVentana('2026-10-01', hoy)).toEqual({ tipo: 'futuro', disponibleDesde: '2026-09-15' });
    expect(estadoVentana('2026-10-10', hoy)).toEqual({ tipo: 'futuro', disponibleDesde: '2026-09-24' });
  });

  it('un día antes del borde pasado queda fuera', () => {
    expect(estadoVentana('2026-06-13', hoy)).toEqual({ tipo: 'pasado' });
  });
});
