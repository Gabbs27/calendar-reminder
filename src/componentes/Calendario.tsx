import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { celdasDelMes, recordatoriosDelDia, sumarDias } from '../dominio/fechas';
import type { Recordatorio } from '../dominio/recordatorio';
import './Calendario.css';

const MAX_VISIBLES = 3;

const formato = (opciones: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-DO', { timeZone: 'UTC', ...opciones });

const FECHA_LARGA = formato({ day: 'numeric', month: 'long', year: 'numeric' });
const MES_Y_ANIO = formato({ month: 'long', year: 'numeric' });
const DIA_CORTO = formato({ weekday: 'short' });
const DIA_LARGO = formato({ weekday: 'long' });

const comoFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);

const mesDe = (iso: string) => {
  const [anio, mes] = iso.split('-').map(Number);
  return { anio, mes };
};

// La semana del 6 de septiembre de 2026 empieza en domingo: de ahí salen los nombres
// de los días, en vez de escribirlos a mano.
const CABECERAS = [0, 1, 2, 3, 4, 5, 6].map((n) => comoFecha(sumarDias('2026-09-06', n)));

interface Props {
  recordatorios: Recordatorio[];
  /** Hoy, en la zona de quien mira. */
  hoy: string;
  mesInicial?: { anio: number; mes: number };
  onAbrirDia: (fecha: string) => void;
  onAbrirRecordatorio?: (recordatorio: Recordatorio) => void;
}

export default function Calendario({
  recordatorios,
  hoy,
  mesInicial,
  onAbrirDia,
  onAbrirRecordatorio,
}: Props) {
  const [{ anio, mes }, setMes] = useState(mesInicial ?? mesDe(hoy));
  const [foco, setFoco] = useState<string | null>(null);
  const cuadricula = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!foco) return;
    cuadricula.current?.querySelector<HTMLElement>(`[data-fecha="${foco}"]`)?.focus();
  }, [foco, anio, mes]);

  const celdas = celdasDelMes(anio, mes);
  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    const semana = celdas.slice(i, i + 7);
    while (semana.length < 7) semana.push(null);
    semanas.push(semana);
  }

  const primero = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const mesDeHoy = mesDe(hoy);
  const enElMesDeHoy = mesDeHoy.anio === anio && mesDeHoy.mes === mes;
  const focoActual = foco ?? (enElMesDeHoy ? hoy : primero);

  const irA = (destino: { anio: number; mes: number }) => {
    setMes(destino);
    setFoco(null);
  };

  const mover = (fecha: string, dias: number) => {
    const destino = sumarDias(fecha, dias);
    const suMes = mesDe(destino);
    if (suMes.anio !== anio || suMes.mes !== mes) setMes(suMes);
    setFoco(destino);
  };

  const alTeclado = (e: KeyboardEvent<HTMLDivElement>, fecha: string) => {
    const saltos: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    if (e.key in saltos) {
      e.preventDefault();
      mover(fecha, saltos[e.key]);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAbrirDia(fecha);
    }
  };

  const abrirRecordatorio = (e: MouseEvent, recordatorio: Recordatorio) => {
    e.stopPropagation();
    onAbrirRecordatorio?.(recordatorio);
  };

  return (
    <section className="calendario">
      <header className="calendario__cabecera">
        <h2 className="calendario__mes">{MES_Y_ANIO.format(comoFecha(primero))}</h2>
        <div className="calendario__controles">
          <button type="button" aria-label="Mes anterior" onClick={() => irA(mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 })}>
            ←
          </button>
          <button type="button" onClick={() => irA(mesDeHoy)}>
            Hoy
          </button>
          <button type="button" aria-label="Mes siguiente" onClick={() => irA(mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 })}>
            →
          </button>
        </div>
      </header>

      <div
        className="calendario__cuadricula"
        role="grid"
        aria-label={`Calendario de ${MES_Y_ANIO.format(comoFecha(primero))}`}
        ref={cuadricula}
      >
        <div className="calendario__semana calendario__semana--nombres" role="row">
          {CABECERAS.map((dia) => (
            <div key={dia.toISOString()} role="columnheader" className="calendario__nombre-dia" aria-label={DIA_LARGO.format(dia)}>
              {DIA_CORTO.format(dia)}
            </div>
          ))}
        </div>

        {semanas.map((semana, i) => (
          <div className="calendario__semana" role="row" key={i}>
            {semana.map((fecha, j) => {
              if (!fecha) return <div className="calendario__celda calendario__celda--vacia" role="gridcell" key={j} />;

              const delDia = recordatoriosDelDia(recordatorios, fecha);
              const visibles = delDia.slice(0, MAX_VISIBLES);
              const ocultos = delDia.length - visibles.length;
              const cuenta = delDia.length === 1 ? '1 recordatorio' : `${delDia.length} recordatorios`;

              return (
                <div
                  key={fecha}
                  role="gridcell"
                  data-fecha={fecha}
                  aria-label={delDia.length ? `${FECHA_LARGA.format(comoFecha(fecha))}, ${cuenta}` : FECHA_LARGA.format(comoFecha(fecha))}
                  aria-current={fecha === hoy ? 'date' : undefined}
                  tabIndex={fecha === focoActual ? 0 : -1}
                  className={`calendario__celda${fecha === hoy ? ' calendario__celda--hoy' : ''}`}
                  onClick={() => onAbrirDia(fecha)}
                  onFocus={() => setFoco(fecha)}
                  onKeyDown={(e) => alTeclado(e, fecha)}
                >
                  <span className="calendario__numero">{Number(fecha.slice(8))}</span>

                  <ul className="calendario__lista">
                    {visibles.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          className={`etiqueta etiqueta--${r.color}`}
                          aria-label={`${r.texto}, a las ${r.hora}`}
                          onClick={(e) => abrirRecordatorio(e, r)}
                        >
                          <span className="etiqueta__hora">{r.hora}</span>
                          <span className="etiqueta__texto">{r.texto}</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {ocultos > 0 && (
                    <button
                      type="button"
                      className="calendario__mas"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbrirDia(fecha);
                      }}
                    >
                      +{ocultos} más
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
