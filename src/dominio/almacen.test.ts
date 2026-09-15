import { describe, it, expect } from 'vitest';
import { crearAlmacen, CLAVE } from './almacen';

const memoria = (inicial: Record<string, string> = {}) => {
  const datos = { ...inicial };
  return {
    getItem: (k: string) => (k in datos ? datos[k] : null),
    setItem: (k: string, v: string) => { datos[k] = v; },
    datos,
  };
};

describe('almacén', () => {
  it('sin nada guardado arranca vacío', () => {
    expect(crearAlmacen(memoria()).cargar()).toEqual({ estado: 'ok', recordatorios: [] });
  });

  it('guarda y vuelve a cargar', () => {
    const s = memoria();
    const a = crearAlmacen(s);
    a.guardar([{ id: '1' } as never]);
    expect(crearAlmacen(s).cargar()).toEqual({ estado: 'ok', recordatorios: [{ id: '1' }] });
  });

  it('JSON corrupto: lo reporta y no lo sobrescribe', () => {
    const s = memoria({ [CLAVE]: '{roto' });
    const a = crearAlmacen(s);
    expect(a.cargar().estado).toBe('corrupto');
    expect(() => a.guardar([])).toThrow(/corrupto/i);
    expect(s.datos[CLAVE]).toBe('{roto');
  });

  it('una versión de esquema desconocida también es corrupto', () => {
    const s = memoria({ [CLAVE]: JSON.stringify({ version: 99, recordatorios: [] }) });
    expect(crearAlmacen(s).cargar().estado).toBe('corrupto');
  });
});
