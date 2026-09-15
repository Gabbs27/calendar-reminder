import type { Recordatorio } from './recordatorio';

export const CLAVE = 'agenda-con-clima';
export const VERSION = 1;

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

export type Carga =
  | { estado: 'ok'; recordatorios: Recordatorio[] }
  | { estado: 'corrupto'; crudo: string };

export function crearAlmacen(storage: Storage) {
  let corrupto = false;

  return {
    cargar(): Carga {
      const crudo = storage.getItem(CLAVE);
      if (crudo === null) return { estado: 'ok', recordatorios: [] };
      try {
        const datos = JSON.parse(crudo);
        if (datos?.version !== VERSION || !Array.isArray(datos.recordatorios)) throw new Error();
        corrupto = false;
        return { estado: 'ok', recordatorios: datos.recordatorios };
      } catch {
        corrupto = true;
        return { estado: 'corrupto', crudo };
      }
    },
    guardar(recordatorios: Recordatorio[]) {
      // Perder los recordatorios de alguien por un JSON inesperado es peor que no guardar.
      if (corrupto) throw new Error('Datos guardados corruptos: no se sobrescriben.');
      storage.setItem(CLAVE, JSON.stringify({ version: VERSION, recordatorios }));
    },
  };
}
