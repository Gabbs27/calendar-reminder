import { describe, it, expect } from 'vitest';
import { etiquetaClima, esPrecipitacion, CODIGOS_DOCUMENTADOS } from './codigos';

describe('códigos WMO', () => {
  it('todos los códigos documentados tienen etiqueta', () => {
    for (const c of CODIGOS_DOCUMENTADOS) expect(etiquetaClima(c)).not.toBe('Desconocido');
  });

  it('96 existe aunque la doc lo limite a Centroeuropa', () => {
    expect(etiquetaClima(96)).toMatch(/granizo/i);
  });

  it('un código fuera de la tabla no rompe', () => {
    expect(etiquetaClima(42)).toBe('Desconocido');
  });

  it('llovizna, lluvia, chubascos y tormenta cuentan como precipitación; niebla no', () => {
    for (const c of [51, 61, 80, 95, 99]) expect(esPrecipitacion(c)).toBe(true);
    for (const c of [0, 3, 45, 71]) expect(esPrecipitacion(c)).toBe(false);
  });
});
