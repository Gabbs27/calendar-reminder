import { useId, useState, type FormEvent } from 'react';
import {
  MAX_TEXTO,
  validarRecordatorio,
  type Errores,
  type Lugar,
  type Recordatorio,
} from '../dominio/recordatorio';
import type { Busqueda } from '../dominio/lugares';
import BuscadorLugar from './BuscadorLugar';
import './FormularioRecordatorio.css';

const COLORES = [
  { valor: 'verde', nombre: 'Verde' },
  { valor: 'azul', nombre: 'Azul' },
  { valor: 'ambar', nombre: 'Ámbar' },
  { valor: 'rosa', nombre: 'Rosa' },
  { valor: 'gris', nombre: 'Gris' },
];

interface Props {
  /** Fecha con la que se abre el formulario; se puede cambiar, incluso al pasado. */
  fecha: string;
  inicial?: Recordatorio | null;
  onGuardar: (datos: Omit<Recordatorio, 'id'>) => void;
  onCancelar?: () => void;
  onBorrar?: () => void;
  buscar?: (nombre: string, opciones: { pais: string | null }) => Promise<Busqueda>;
}

export default function FormularioRecordatorio({
  fecha,
  inicial,
  onGuardar,
  onCancelar,
  onBorrar,
  buscar,
}: Props) {
  const id = useId();
  const [texto, setTexto] = useState(inicial?.texto ?? '');
  const [dia, setDia] = useState(inicial?.fecha ?? fecha);
  const [hora, setHora] = useState(inicial?.hora ?? '09:00');
  const [lugar, setLugar] = useState<Lugar | null>(inicial?.lugar ?? null);
  const [color, setColor] = useState(inicial?.color ?? 'verde');
  const [alAireLibre, setAlAireLibre] = useState(inicial?.alAireLibre ?? false);
  const [errores, setErrores] = useState<Errores>({});

  const largo = Array.from(texto.trim()).length;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const datos = { texto: texto.trim(), fecha: dia, hora, lugar, color, alAireLibre };
    // Los mensajes salen del dominio: no se repiten aquí.
    const fallos = validarRecordatorio({ id: inicial?.id ?? '', ...datos });
    setErrores(fallos);
    if (Object.keys(fallos).length > 0) return;
    onGuardar(datos);
  };

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <div className="campo">
        <div className="campo__linea">
          <label className="campo__etiqueta" htmlFor={`${id}-texto`}>
            Recordatorio
          </label>
          <span className={`campo__contador${largo > MAX_TEXTO ? ' campo__contador--pasado' : ''}`}>
            {largo}/{MAX_TEXTO}
          </span>
        </div>
        <input
          id={`${id}-texto`}
          className="campo__control"
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={errores.texto ? true : undefined}
        />
        {errores.texto && <p className="campo__error">{errores.texto}</p>}
      </div>

      <div className="formulario__fila">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor={`${id}-fecha`}>
            Fecha
          </label>
          <input
            id={`${id}-fecha`}
            className="campo__control"
            type="date"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
          />
          {errores.fecha && <p className="campo__error">{errores.fecha}</p>}
        </div>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor={`${id}-hora`}>
            Hora
          </label>
          <input
            id={`${id}-hora`}
            className="campo__control"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
          {errores.hora && <p className="campo__error">{errores.hora}</p>}
        </div>
      </div>

      <div className="campo">
        <BuscadorLugar valor={lugar} onElegir={setLugar} buscar={buscar} error={errores.lugar} />
      </div>

      <div className="formulario__fila">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor={`${id}-color`}>
            Color
          </label>
          <select
            id={`${id}-color`}
            className="campo__control"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            {COLORES.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <label className="campo__casilla">
          <input
            type="checkbox"
            checked={alAireLibre}
            onChange={(e) => setAlAireLibre(e.target.checked)}
          />
          Plan al aire libre
        </label>
      </div>

      <div className="formulario__acciones">
        {onBorrar && (
          <button type="button" className="boton boton--peligro" onClick={onBorrar}>
            Borrar
          </button>
        )}
        <span className="formulario__espacio" />
        {onCancelar && (
          <button type="button" className="boton" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="boton boton--principal">
          Guardar
        </button>
      </div>
    </form>
  );
}
