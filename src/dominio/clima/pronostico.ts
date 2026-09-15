export type Pronostico =
  | { tipo: 'ok'; codigo: number; max: number; min: number; probLluvia: number | null }
  | { tipo: 'sin-datos' }
  | { tipo: 'fuera-de-rango'; motivo: string }
  | { tipo: 'error' };

type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const CAMPOS = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max';

export async function pronosticoDiario(
  lugar: { latitud: number; longitud: number; zonaHoraria: string },
  fecha: string,
  fetchImpl: Fetch = fetch
): Promise<Pronostico> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lugar.latitud));
  url.searchParams.set('longitude', String(lugar.longitud));
  url.searchParams.set('timezone', lugar.zonaHoraria);
  url.searchParams.set('daily', CAMPOS);
  url.searchParams.set('start_date', fecha);
  url.searchParams.set('end_date', fecha);

  try {
    const cuerpo = (await (await fetchImpl(url.toString())).json()) as any;
    if (cuerpo?.error) {
      return /out of allowed range/i.test(cuerpo.reason ?? '')
        ? { tipo: 'fuera-de-rango', motivo: cuerpo.reason }
        : { tipo: 'error' };
    }
    const d = cuerpo?.daily;
    if (!d || !Array.isArray(d.weather_code) || d.weather_code.length === 0) return { tipo: 'error' };
    // Dentro de la ventana, la API contesta 200 con nulos los días que no tiene: más de
    // unos 68 hacia atrás y el día 16. Observado el 2026-09-14.
    const codigo = d.weather_code[0];
    const max = d.temperature_2m_max?.[0] ?? null;
    const min = d.temperature_2m_min?.[0] ?? null;
    if (codigo === null || max === null || min === null) return { tipo: 'sin-datos' };
    return {
      tipo: 'ok',
      codigo,
      max,
      min,
      probLluvia: d.precipitation_probability_max?.[0] ?? null,
    };
  } catch {
    return { tipo: 'error' };
  }
}
