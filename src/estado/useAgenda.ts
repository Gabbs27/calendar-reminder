import { useCallback, useMemo, useRef, useState } from 'react';
import { crearAlmacen } from '../dominio/almacen';
import type { Recordatorio } from '../dominio/recordatorio';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

export interface Agenda {
  recordatorios: Recordatorio[];
  corrupto: boolean;
  crear(datos: Omit<Recordatorio, 'id'>): Recordatorio | null;
  editar(id: string, cambios: Partial<Omit<Recordatorio, 'id'>>): void;
  borrar(id: string): void;
}

const idPorDefecto = () => crypto.randomUUID();

export function useAgenda(
  storage: Storage = localStorage,
  nuevoId: () => string = idPorDefecto
): Agenda {
  const almacen = useMemo(() => crearAlmacen(storage), [storage]);
  const [estado, setEstado] = useState(() => {
    const carga = almacen.cargar();
    return carga.estado === 'ok'
      ? { corrupto: false, recordatorios: carga.recordatorios }
      : { corrupto: true, recordatorios: [] as Recordatorio[] };
  });
  // La lista viva, para que dos llamadas seguidas en el mismo tick no se pisen.
  const lista = useRef(estado.recordatorios);

  const guardar = useCallback(
    (recordatorios: Recordatorio[]) => {
      almacen.guardar(recordatorios);
      lista.current = recordatorios;
      setEstado({ corrupto: false, recordatorios });
    },
    [almacen]
  );

  // Con lo guardado corrupto no se escribe nada. El almacén lanzaría de todos modos:
  // perder los recordatorios de alguien por un JSON inesperado es peor que no guardar.
  const crear = useCallback(
    (datos: Omit<Recordatorio, 'id'>) => {
      if (estado.corrupto) return null;
      const recordatorio = { ...datos, id: nuevoId() };
      guardar([...lista.current, recordatorio]);
      return recordatorio;
    },
    [estado.corrupto, guardar, nuevoId]
  );

  const editar = useCallback(
    (id: string, cambios: Partial<Omit<Recordatorio, 'id'>>) => {
      if (estado.corrupto) return;
      // El id se conserva siempre: editar no crea otro recordatorio.
      guardar(lista.current.map((r) => (r.id === id ? { ...r, ...cambios, id: r.id } : r)));
    },
    [estado.corrupto, guardar]
  );

  const borrar = useCallback(
    (id: string) => {
      if (estado.corrupto) return;
      guardar(lista.current.filter((r) => r.id !== id));
    },
    [estado.corrupto, guardar]
  );

  return { recordatorios: estado.recordatorios, corrupto: estado.corrupto, crear, editar, borrar };
}
