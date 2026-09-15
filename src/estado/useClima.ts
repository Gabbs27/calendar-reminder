import { useEffect, useState } from 'react';
import { pronosticoDiario, type Pronostico } from '../dominio/clima/pronostico';
import { estadoVentana, type Ventana } from '../dominio/clima/ventana';
import { hoyEn } from '../dominio/fechas';
import type { Lugar } from '../dominio/recordatorio';

export type Clima =
  | { estado: 'cargando' }
  | { estado: 'fuera-de-ventana'; ventana: Ventana }
  | { estado: 'listo'; pronostico: Pronostico; consultadoA: number };

type Pedir = (lugar: Lugar, fecha: string) => Promise<Pronostico>;

interface Opciones {
  pedir?: Pedir;
  /** Hoy en la zona del lugar. Los tests lo fijan para no depender del reloj. */
  hoy?: string;
}

// El clima no vive dentro del recordatorio: se consulta por coordenadas y fecha, y se
// cachea con la hora de la consulta. Guardarlo al crear fue el fallo de 2023.
const cache = new Map<string, { pronostico: Pronostico; consultadoA: number }>();

export const limpiarCacheClima = () => cache.clear();

export function useClima(lugar: Lugar | null, fecha: string, opciones: Opciones = {}): Clima {
  const { pedir = pronosticoDiario, hoy } = opciones;
  const [clima, setClima] = useState<Clima>({ estado: 'cargando' });

  const latitud = lugar?.latitud;
  const longitud = lugar?.longitud;
  const zonaHoraria = lugar?.zonaHoraria;

  useEffect(() => {
    if (!lugar) return;

    const ventana = estadoVentana(fecha, hoy ?? hoyEn(lugar.zonaHoraria));
    if (ventana.tipo !== 'disponible') {
      setClima({ estado: 'fuera-de-ventana', ventana });
      return;
    }

    const clave = `${lugar.latitud},${lugar.longitud},${fecha}`;
    const guardado = cache.get(clave);
    if (guardado) {
      setClima({ estado: 'listo', ...guardado });
      return;
    }

    let vigente = true;
    setClima({ estado: 'cargando' });

    const guardar = (pronostico: Pronostico) => {
      const entrada = { pronostico, consultadoA: Date.now() };
      // Un error no se cachea: al volver a abrir el día se vuelve a intentar.
      if (pronostico.tipo !== 'error') cache.set(clave, entrada);
      if (vigente) setClima({ estado: 'listo', ...entrada });
    };

    pedir(lugar, fecha)
      .then(guardar)
      .catch(() => guardar({ tipo: 'error' }));

    return () => {
      vigente = false;
    };
  }, [latitud, longitud, zonaHoraria, fecha, hoy, pedir]);

  return clima;
}
