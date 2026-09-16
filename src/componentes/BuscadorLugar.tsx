import { useEffect, useId, useState } from 'react';
import { buscarLugares, type Busqueda } from '../dominio/lugares';
import type { Lugar } from '../dominio/recordatorio';
import './BuscadorLugar.css';

const ESPERA_MS = 300;
const MINIMO = 2;

const PAISES = new Intl.DisplayNames(['es-DO'], { type: 'region' });

const nombrePais = (codigo: string) => {
  try {
    return PAISES.of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
};

export const etiquetaLugar = (lugar: Lugar) =>
  [lugar.nombre, lugar.provincia, nombrePais(lugar.pais)].filter(Boolean).join(', ');

type Buscar = (nombre: string, opciones: { pais: string | null }) => Promise<Busqueda>;

interface Props {
  valor: Lugar | null;
  onElegir: (lugar: Lugar) => void;
  buscar?: Buscar;
  error?: string;
}

export default function BuscadorLugar({ valor, onElegir, buscar = buscarLugares, error }: Props) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [todoElMundo, setTodoElMundo] = useState(false);
  const [estado, setEstado] = useState<'quieto' | 'buscando' | 'ok' | 'error'>('quieto');
  const [lugares, setLugares] = useState<Lugar[]>([]);

  useEffect(() => {
    const consulta = texto.trim();
    if (consulta.length < MINIMO) {
      setEstado('quieto');
      setLugares([]);
      return;
    }

    let vigente = true;
    setEstado('buscando');
    const temporizador = setTimeout(() => {
      // El buscador nunca lanza: distingue «no hay coincidencias» de «no se pudo buscar».
      buscar(consulta, { pais: todoElMundo ? null : 'DO' }).then((r) => {
        if (!vigente) return;
        setEstado(r.tipo);
        setLugares(r.tipo === 'ok' ? r.lugares : []);
      });
    }, ESPERA_MS);

    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [texto, todoElMundo, buscar]);

  const elegir = (lugar: Lugar) => {
    onElegir(lugar);
    setTexto('');
    setLugares([]);
    setEstado('quieto');
  };

  return (
    <div className="buscador">
      <label className="campo__etiqueta" htmlFor={`${id}-lugar`}>
        Lugar
      </label>
      <input
        id={`${id}-lugar`}
        className="campo__control"
        type="text"
        autoComplete="off"
        placeholder="Santo Domingo, Santiago…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
      />

      <label className="buscador__mundo">
        <input
          type="checkbox"
          checked={todoElMundo}
          onChange={(e) => setTodoElMundo(e.target.checked)}
        />
        Buscar en todo el mundo
      </label>

      {valor && <p className="buscador__elegido">{etiquetaLugar(valor)}</p>}

      {estado === 'ok' && lugares.length > 0 && (
        <ul className="buscador__resultados">
          {lugares.map((lugar) => (
            <li key={`${lugar.latitud},${lugar.longitud}`}>
              <button type="button" onClick={() => elegir(lugar)}>
                {etiquetaLugar(lugar)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {estado === 'ok' && lugares.length === 0 && <p className="buscador__aviso">Sin resultados</p>}
      {estado === 'error' && (
        <p className="buscador__aviso">No se pudo buscar. Revisa la conexión e inténtalo otra vez.</p>
      )}
      {error && (
        <p className="campo__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
