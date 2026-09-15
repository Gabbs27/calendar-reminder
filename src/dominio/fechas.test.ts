import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { celdasDelMes, sumarDias, recordatoriosDelDia } from './fechas';

// Se comprueba a los dos lados de UTC a propósito: ninguna zona sola detecta los dos
// fallos. En una zona al oeste (esta máquina está en UTC−4) un sumarDias hecho con la
// medianoche local pasa igual; en una al este pasa un celdasDelMes que lea el día con
// getDay() en vez de getUTCDay().
describe.each(['Pacific/Kiritimati', 'Pacific/Pago_Pago'])('en la zona %s', (zona) => {
  beforeAll(() => {
    vi.stubEnv('TZ', zona);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('celdasDelMes', () => {
    it('septiembre 2026: empieza martes, 30 días', () => {
      const celdas = celdasDelMes(2026, 9);
      expect(celdas.slice(0, 2)).toEqual([null, null]);
      expect(celdas[2]).toBe('2026-09-01');
      expect(celdas.filter(Boolean)).toHaveLength(30);
    });

    it('febrero 2023: empieza miércoles, 28 días', () => {
      const celdas = celdasDelMes(2023, 2);
      expect(celdas.slice(0, 3)).toEqual([null, null, null]);
      expect(celdas[3]).toBe('2023-02-01');
      expect(celdas.filter(Boolean)).toHaveLength(28);
    });

    it('febrero 2024 es bisiesto', () => {
      expect(celdasDelMes(2024, 2).filter(Boolean)).toHaveLength(29);
    });
  });

  describe('sumarDias', () => {
    it('cruza meses y años sin depender de la zona horaria de la máquina', () => {
      expect(sumarDias('2026-09-14', 16)).toBe('2026-09-30');
      expect(sumarDias('2026-09-14', -92)).toBe('2026-06-14');
      expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    });
  });
});

describe('recordatoriosDelDia — regresión del fallo de 2023', () => {
  const r = (fecha: string) => ({ id: fecha, fecha });

  it('un recordatorio el día 5 aparece el día 5', () => {
    expect(recordatoriosDelDia([r('2026-09-05')], '2026-09-05')).toHaveLength(1);
  });

  it('el 5 de septiembre no aparece el 5 de octubre', () => {
    expect(recordatoriosDelDia([r('2026-09-05')], '2026-10-05')).toHaveLength(0);
  });
});
