import { describe, it, expect, vi } from 'vitest';
import { pronosticoDiario } from './pronostico';

const lugar = { latitud: 18.4861, longitud: -69.9312, zonaHoraria: 'America/Santo_Domingo' };

const respuesta = (cuerpo: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: async () => cuerpo });

describe('pronosticoDiario', () => {
  it('pide los campos y la fecha exactos', async () => {
    const f = respuesta({ daily: { weather_code: [51], temperature_2m_max: [30.6], temperature_2m_min: [23.2], precipitation_probability_max: [80] } });
    await pronosticoDiario(lugar, '2026-09-20', f);
    const url = new URL(f.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('daily')).toBe('weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    expect(url.searchParams.get('start_date')).toBe('2026-09-20');
    expect(url.searchParams.get('end_date')).toBe('2026-09-20');
    expect(url.searchParams.get('timezone')).toBe('America/Santo_Domingo');
  });

  it('devuelve el día pedido', async () => {
    const f = respuesta({ daily: { weather_code: [51], temperature_2m_max: [30.6], temperature_2m_min: [23.2], precipitation_probability_max: [80] } });
    expect(await pronosticoDiario(lugar, '2026-09-20', f)).toEqual({ tipo: 'ok', codigo: 51, max: 30.6, min: 23.2, probLluvia: 80 });
  });

  it('el error de rango de la API se vuelve fuera-de-rango, con su motivo', async () => {
    const f = respuesta({ error: true, reason: "Parameter 'start_date' is out of allowed range from 2026-06-14 to 2026-09-30" }, false);
    const r = await pronosticoDiario(lugar, '2026-10-10', f);
    expect(r).toEqual({ tipo: 'fuera-de-rango', motivo: expect.stringMatching(/out of allowed range/) });
  });

  it('un día dentro de la ventana pero sin datos no es un pronóstico', async () => {
    // Respuesta real del 2026-09-14 para el 2026-09-30, el día 16: la API lo acepta y
    // contesta 200, pero el código y las temperaturas vienen en null.
    const f = respuesta({ daily: { time: ['2026-09-30'], weather_code: [null], temperature_2m_max: [null], temperature_2m_min: [null], precipitation_probability_max: [52] } });
    expect(await pronosticoDiario(lugar, '2026-09-30', f)).toEqual({ tipo: 'sin-datos' });
  });

  it('un fallo de red no lanza — regresión del fallo de 2023', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(pronosticoDiario(lugar, '2026-09-20', f)).resolves.toEqual({ tipo: 'error' });
  });

  it('una respuesta sin daily no lanza', async () => {
    await expect(pronosticoDiario(lugar, '2026-09-20', respuesta({}))).resolves.toEqual({ tipo: 'error' });
  });
});
