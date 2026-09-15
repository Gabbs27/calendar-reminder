import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAgenda } from './useAgenda';
import { CLAVE } from '../dominio/almacen';
import type { Recordatorio } from '../dominio/recordatorio';

const memoria = (inicial: Record<string, string> = {}) => {
  const datos = { ...inicial };
  return {
    getItem: (k: string) => (k in datos ? datos[k] : null),
    setItem: (k: string, v: string) => { datos[k] = v; },
    datos,
  };
};

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

const lugar = {
  nombre: 'Santo Domingo',
  provincia: 'Distrito Nacional',
  pais: 'DO',
  latitud: 18.4861,
  longitud: -69.9312,
  zonaHoraria: 'America/Santo_Domingo',
};

const datosDe = (texto: string): Omit<Recordatorio, 'id'> => ({
  texto,
  fecha: '2026-09-20',
  hora: '09:00',
  lugar,
  color: 'verde',
  alAireLibre: true,
});

const guardados = (s: ReturnType<typeof memoria>) => JSON.parse(s.datos[CLAVE]).recordatorios;

describe('useAgenda', () => {
  it('crea, guarda y al volver a montar sigue ahí', () => {
    const s = memoria();
    const { result } = renderHook(() => useAgenda(s, ids()));
    act(() => {
      result.current.crear(datosDe('Playa'));
    });
    expect(result.current.recordatorios).toHaveLength(1);
    expect(guardados(s)[0].texto).toBe('Playa');
    expect(renderHook(() => useAgenda(s, ids())).result.current.recordatorios).toHaveLength(1);
  });

  it('editar conserva el id', () => {
    const s = memoria();
    const { result } = renderHook(() => useAgenda(s, ids()));
    act(() => {
      result.current.crear(datosDe('Playa'));
    });
    const { id } = result.current.recordatorios[0];
    act(() => {
      result.current.editar(id, { texto: 'Cine', alAireLibre: false });
    });
    expect(result.current.recordatorios).toEqual([
      expect.objectContaining({ id, texto: 'Cine', alAireLibre: false }),
    ]);
    expect(guardados(s)[0].id).toBe(id);
  });

  it('borrar lo quita también de lo guardado', () => {
    const s = memoria();
    const { result } = renderHook(() => useAgenda(s, ids()));
    act(() => {
      result.current.crear(datosDe('Playa'));
      result.current.crear(datosDe('Cine'));
    });
    act(() => {
      result.current.borrar(result.current.recordatorios[0].id);
    });
    expect(result.current.recordatorios.map((r) => r.texto)).toEqual(['Cine']);
    expect(guardados(s)).toHaveLength(1);
  });

  it('con lo guardado corrupto lo dice y no sobrescribe nada', () => {
    const s = memoria({ [CLAVE]: '{roto' });
    const { result } = renderHook(() => useAgenda(s, ids()));
    expect(result.current.corrupto).toBe(true);
    act(() => {
      result.current.crear(datosDe('Playa'));
    });
    expect(result.current.recordatorios).toEqual([]);
    expect(s.datos[CLAVE]).toBe('{roto');
  });
});
