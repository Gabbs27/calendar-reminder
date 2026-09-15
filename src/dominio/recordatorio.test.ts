import { describe, it, expect } from 'vitest';
import { validarRecordatorio, type Recordatorio } from './recordatorio';

const lugar = {
  nombre: 'Santiago de los Caballeros',
  provincia: 'Provincia de Santiago',
  pais: 'DO',
  latitud: 19.45036,
  longitud: -70.69085,
  zonaHoraria: 'America/Santo_Domingo',
};

const base: Recordatorio = {
  id: '1',
  texto: 'Playa',
  fecha: '2026-09-20',
  hora: '09:00',
  lugar,
  color: 'verde',
  alAireLibre: true,
};

describe('validarRecordatorio', () => {
  it('acepta exactamente 30 caracteres', () => {
    expect(validarRecordatorio({ ...base, texto: 'a'.repeat(30) })).toEqual({});
  });

  it('rechaza 31', () => {
    expect(validarRecordatorio({ ...base, texto: 'a'.repeat(31) }).texto).toMatch(/30/);
  });

  it('rechaza vacío y solo espacios', () => {
    expect(validarRecordatorio({ ...base, texto: '' }).texto).toBeTruthy();
    expect(validarRecordatorio({ ...base, texto: '   ' }).texto).toBeTruthy();
  });

  it('cuenta un emoji como un carácter', () => {
    expect(validarRecordatorio({ ...base, texto: '🌧'.repeat(30) })).toEqual({});
  });

  it('exige lugar, fecha válida y hora válida', () => {
    expect(validarRecordatorio({ ...base, lugar: null }).lugar).toBeTruthy();
    expect(validarRecordatorio({ ...base, fecha: '2026-02-30' }).fecha).toBeTruthy();
    expect(validarRecordatorio({ ...base, hora: '25:00' }).hora).toBeTruthy();
  });
});
