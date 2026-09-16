import { useState } from 'react';
import Calendario from './componentes/Calendario';
import FormularioRecordatorio from './componentes/FormularioRecordatorio';
import PanelDia from './componentes/PanelDia';
import { hoyEn, recordatoriosDelDia } from './dominio/fechas';
import type { Busqueda } from './dominio/lugares';
import type { Recordatorio } from './dominio/recordatorio';
import { useAgenda } from './estado/useAgenda';
import type { useClima } from './estado/useClima';
import './App.css';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;
type OpcionesClima = NonNullable<Parameters<typeof useClima>[2]>;

interface Props {
  storage?: Storage;
  /** Hoy; en producción sale de la zona horaria del navegador. */
  hoy?: string;
  nuevoId?: () => string;
  buscar?: (nombre: string, opciones: { pais: string | null }) => Promise<Busqueda>;
  pedirClima?: OpcionesClima['pedir'];
}

const zonaDelNavegador = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function App({ storage, hoy, nuevoId, buscar, pedirClima }: Props = {}) {
  const agenda = useAgenda(storage, nuevoId);
  const [dia, setDia] = useState<string | null>(null);
  const [editando, setEditando] = useState<Recordatorio | 'nuevo' | null>(null);

  const diaDeHoy = hoy ?? hoyEn(zonaDelNavegador());
  // Sin `hoy` fijo, la ventana se calcula en la zona del lugar de cada recordatorio.
  const opcionesClima: OpcionesClima = { pedir: pedirClima, hoy };

  const abrirDia = (fecha: string) => {
    setDia(fecha);
    setEditando(null);
  };

  const abrirRecordatorio = (recordatorio: Recordatorio) => {
    setDia(recordatorio.fecha);
    setEditando(recordatorio);
  };

  const guardar = (datos: Omit<Recordatorio, 'id'>) => {
    if (editando && editando !== 'nuevo') agenda.editar(editando.id, datos);
    else agenda.crear(datos);
    setDia(datos.fecha);
    setEditando(null);
  };

  return (
    <div className="app">
      <header className="app__cabecera">
        <h1 className="app__titulo">Agenda con clima</h1>
        <p className="app__subtitulo">Recordatorios con el pronóstico de su día y de su lugar.</p>
      </header>

      {agenda.corrupto && (
        <p className="app__alerta" role="alert">
          No se pudieron leer los recordatorios guardados en este navegador. No se ha borrado ni
          sobrescrito nada, así que lo que hay sigue intacto.
        </p>
      )}

      <main className="app__contenido">
        <Calendario
          recordatorios={agenda.recordatorios}
          hoy={diaDeHoy}
          onAbrirDia={abrirDia}
          onAbrirRecordatorio={abrirRecordatorio}
        />

        {dia && (
          <aside className="app__panel">
            {editando ? (
              <FormularioRecordatorio
                fecha={dia}
                inicial={editando === 'nuevo' ? null : editando}
                buscar={buscar}
                onGuardar={guardar}
                onCancelar={() => setEditando(null)}
                onBorrar={
                  editando === 'nuevo'
                    ? undefined
                    : () => {
                        agenda.borrar(editando.id);
                        setEditando(null);
                      }
                }
              />
            ) : (
              <PanelDia
                fecha={dia}
                recordatorios={recordatoriosDelDia(agenda.recordatorios, dia)}
                onNuevo={agenda.corrupto ? undefined : () => setEditando('nuevo')}
                onEditar={(r) => setEditando(r)}
                onBorrar={(id) => agenda.borrar(id)}
                onCerrar={() => setDia(null)}
                opcionesClima={opcionesClima}
              />
            )}
          </aside>
        )}
      </main>
    </div>
  );
}
