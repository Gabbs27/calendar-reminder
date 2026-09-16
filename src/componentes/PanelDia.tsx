import type { Recordatorio } from '../dominio/recordatorio';
import type { useClima } from '../estado/useClima';
import { etiquetaLugar } from './BuscadorLugar';
import ClimaRecordatorio from './ClimaRecordatorio';
import './PanelDia.css';

const FECHA_LARGA = new Intl.DateTimeFormat('es-DO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const comoFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);

interface Props {
  fecha: string;
  recordatorios: Recordatorio[];
  /** Sin esto no se puede crear: es lo que pasa cuando lo guardado está corrupto. */
  onNuevo?: () => void;
  onEditar: (recordatorio: Recordatorio) => void;
  onBorrar: (id: string) => void;
  onCerrar: () => void;
  opcionesClima?: Parameters<typeof useClima>[2];
}

export default function PanelDia({
  fecha,
  recordatorios,
  onNuevo,
  onEditar,
  onBorrar,
  onCerrar,
  opcionesClima,
}: Props) {
  const titulo = FECHA_LARGA.format(comoFecha(fecha));

  return (
    <section className="panel" aria-label={`Recordatorios del ${titulo}`}>
      <header className="panel__cabecera">
        <h2 className="panel__titulo">{titulo}</h2>
        <button type="button" className="panel__cerrar" aria-label="Cerrar el día" onClick={onCerrar}>
          ×
        </button>
      </header>

      {recordatorios.length === 0 && <p className="panel__vacio">No hay nada agendado este día.</p>}

      {recordatorios.length > 0 && (
        <ul className="panel__lista">
          {recordatorios.map((r) => (
            <li key={r.id} className={`tarjeta tarjeta--${r.color}`}>
              <div className="tarjeta__linea">
                <span className="tarjeta__hora">{r.hora}</span>
                <strong className="tarjeta__texto">{r.texto}</strong>
                <span className="tarjeta__acciones">
                  <button type="button" aria-label={`Editar ${r.texto}`} onClick={() => onEditar(r)}>
                    Editar
                  </button>
                  <button type="button" aria-label={`Borrar ${r.texto}`} onClick={() => onBorrar(r.id)}>
                    Borrar
                  </button>
                </span>
              </div>

              {r.lugar && <p className="tarjeta__lugar">{etiquetaLugar(r.lugar)}</p>}

              <ClimaRecordatorio
                lugar={r.lugar}
                fecha={r.fecha}
                alAireLibre={r.alAireLibre}
                opciones={opcionesClima}
              />
            </li>
          ))}
        </ul>
      )}

      {onNuevo && (
        <button type="button" className="boton boton--principal panel__nuevo" onClick={onNuevo}>
          Nuevo recordatorio
        </button>
      )}
    </section>
  );
}
