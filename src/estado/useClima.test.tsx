import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClima, limpiarCacheClima } from './useClima';
import type { Pronostico } from '../dominio/clima/pronostico';

const SD = {
  nombre: 'Santo Domingo', pais: 'DO',
  latitud: 18.4861, longitud: -69.9312, zonaHoraria: 'America/Santo_Domingo',
};
const STI = {
  nombre: 'Santiago de los Caballeros', pais: 'DO',
  latitud: 19.45036, longitud: -70.69085, zonaHoraria: 'America/Santo_Domingo',
};
const HOY = '2026-09-14';

const pronostico = (codigo: number): Pronostico => ({ tipo: 'ok', codigo, max: 31, min: 23, probLluvia: 20 });

describe('useClima', () => {
  beforeEach(() => {
    limpiarCacheClima();
  });

  it('fuera de la ventana no pide nada y dice desde cuándo', async () => {
    const pedir = vi.fn();
    const { result } = renderHook(() => useClima(SD, '2026-12-25', { pedir, hoy: HOY }));
    await waitFor(() => expect(result.current.estado).toBe('fuera-de-ventana'));
    expect(pedir).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ ventana: { tipo: 'futuro', disponibleDesde: '2026-12-09' } });
  });

  it('dos lugares el mismo día no comparten pronóstico — regresión del fallo de 2023', async () => {
    // El segundo se monta con el primero ya resuelto y en caché: si la caché ignorara
    // las coordenadas, este test vería el clima del otro lugar, que es el fallo de 2023.
    const pedir = vi.fn(async (lugar: { latitud: number }) => pronostico(lugar.latitud === SD.latitud ? 61 : 0));
    const a = renderHook(() => useClima(SD, '2026-09-20', { pedir, hoy: HOY }));
    await waitFor(() => expect(a.result.current.estado).toBe('listo'));
    const b = renderHook(() => useClima(STI, '2026-09-20', { pedir, hoy: HOY }));
    await waitFor(() => expect(b.result.current.estado).toBe('listo'));
    expect(a.result.current).toMatchObject({ pronostico: { codigo: 61 } });
    expect(b.result.current).toMatchObject({ pronostico: { codigo: 0 } });
  });

  it('cachea por lugar y fecha, y anota cuándo se consultó', async () => {
    const pedir = vi.fn(async () => pronostico(51));
    const a = renderHook(() => useClima(SD, '2026-09-20', { pedir, hoy: HOY }));
    await waitFor(() => expect(a.result.current.estado).toBe('listo'));
    const b = renderHook(() => useClima(SD, '2026-09-20', { pedir, hoy: HOY }));
    await waitFor(() => expect(b.result.current.estado).toBe('listo'));
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(a.result.current).toMatchObject({ consultadoA: expect.any(Number) });
  });

  it('una consulta que falla no rompe el hook ni el siguiente recordatorio — regresión del fallo de 2023', async () => {
    const pedir = vi.fn().mockRejectedValueOnce(new Error('caída')).mockResolvedValueOnce(pronostico(3));
    const a = renderHook(() => useClima(SD, '2026-09-20', { pedir, hoy: HOY }));
    await waitFor(() => expect(a.result.current.estado).toBe('listo'));
    expect(a.result.current).toMatchObject({ pronostico: { tipo: 'error' } });

    const b = renderHook(() => useClima(STI, '2026-09-20', { pedir, hoy: HOY }));
    await waitFor(() => expect(b.result.current).toMatchObject({ pronostico: { codigo: 3 } }));
  });
});
