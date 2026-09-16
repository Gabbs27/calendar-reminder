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
        <div>
          <h1 className="app__titulo">Agenda con clima</h1>
          <p className="app__subtitulo">Recordatorios con el pronóstico de su día y de su lugar.</p>
        </div>

        {/* El reto de 2023 se sirve tal cual en /calendar-reminder/. La pestaña lleva a
            /2023, que lo enmarca con esta misma barra: la vuelta vive fuera de él, porque
            ponerle un enlace dentro sería cambiar lo que se entregó. */}
        <nav className="app__versiones" aria-label="Versiones">
          <a className="app__version" href="/" aria-current="page">
            Ahora
          </a>
          <a className="app__version" href="/2023/">
            2023
          </a>
        </nav>
      </header>

      {agenda.corrupto && (
        <p className="app__alerta" role="alert">
          No se pudieron leer los recordatorios guardados en este navegador. No se ha borrado ni
          sobrescrito nada, así que lo que hay sigue intacto.
        </p>
      )}

      <main className={`app__contenido${dia ? ' app__contenido--con-panel' : ''}`}>
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

      <footer className="app__pie">
        <p>
          Los recordatorios se guardan solo en este navegador, sin cuentas ni servidor. El clima lo
          da{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>
          .
        </p>
        <p>
          <a href="/2023/">El reto de 2023</a>
          <span aria-hidden="true"> · </span>
          <a
            href="https://github.com/Gabbs27/calendar-reminder"
            target="_blank"
            rel="noopener noreferrer">
            Código
          </a>
          <span aria-hidden="true"> · </span>
          <a href="https://codewithgabo.com" target="_blank" rel="noopener noreferrer">
            codewithgabo.com
          </a>
        </p>
      </footer>
    </div>
  );
}
