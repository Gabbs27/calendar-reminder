import type { Lugar } from './recordatorio';

type Fetch = (url: string) => Promise<{ json(): Promise<unknown> }>;

export type Busqueda = { tipo: 'ok'; lugares: Lugar[] } | { tipo: 'error' };

export async function buscarLugares(
  nombre: string,
  { pais }: { pais: string | null },
  fetchImpl: Fetch = fetch
): Promise<Busqueda> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', nombre);
  url.searchParams.set('count', '10');
  url.searchParams.set('language', 'es');
  if (pais) url.searchParams.set('countryCode', pais);

  try {
    const cuerpo = (await (await fetchImpl(url.toString())).json()) as any;
    // Sin coincidencias la API no manda `results: []`: no manda la clave. Una búsqueda
    // vacía y un fallo de red son cosas distintas, y por eso no comparten respuesta.
    return {
      tipo: 'ok',
      lugares: (cuerpo?.results ?? []).map((r: any) => ({
        nombre: r.name,
        provincia: r.admin1,
        pais: r.country_code,
        latitud: r.latitude,
        longitud: r.longitude,
        zonaHoraria: r.timezone,
      })),
    };
  } catch {
    return { tipo: 'error' };
  }
}
