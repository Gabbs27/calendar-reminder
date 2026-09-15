import { describe, it, expect, vi } from 'vitest';
import { buscarLugares } from './lugares';

const responde = (cuerpo: unknown) => vi.fn().mockResolvedValue({ ok: true, json: async () => cuerpo });

describe('buscarLugares', () => {
  it('filtra por RD cuando se pide', async () => {
    const f = responde({ results: [] });
    await buscarLugares('Santiago', { pais: 'DO' }, f);
    const url = new URL(f.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect(url.searchParams.get('countryCode')).toBe('DO');
    expect(url.searchParams.get('language')).toBe('es');
  });

  it('sin filtro no manda countryCode', async () => {
    const f = responde({ results: [] });
    await buscarLugares('Santiago', { pais: null }, f);
    expect(new URL(f.mock.calls[0][0]).searchParams.has('countryCode')).toBe(false);
  });

  it('una respuesta sin la clave results es una búsqueda vacía, no un error', async () => {
    // Sin coincidencias la API no manda `results: []`: no manda la clave.
    const r = await buscarLugares('Xqzvtlandia', { pais: null }, responde({ generationtime_ms: 0.4 }));
    expect(r).toEqual({ tipo: 'ok', lugares: [] });
  });

  it('guarda coordenadas, provincia, país y zona horaria', async () => {
    const f = responde({ results: [{
      name: 'Santiago de los Caballeros', admin1: 'Provincia de Santiago', country_code: 'DO',
      latitude: 19.45036, longitude: -70.69085, timezone: 'America/Santo_Domingo',
    }] });
    expect(await buscarLugares('Santiago', { pais: 'DO' }, f)).toEqual({
      tipo: 'ok',
      lugares: [{
        nombre: 'Santiago de los Caballeros', provincia: 'Provincia de Santiago', pais: 'DO',
        latitud: 19.45036, longitud: -70.69085, zonaHoraria: 'America/Santo_Domingo',
      }],
    });
  });

  it('un fallo de red no lanza, y no se confunde con una búsqueda sin resultados', async () => {
    const r = await buscarLugares('x', { pais: 'DO' }, vi.fn().mockRejectedValue(new Error()));
    expect(r).toEqual({ tipo: 'error' });
  });
});
