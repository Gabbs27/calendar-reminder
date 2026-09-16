import { avisoLluvia } from '../dominio/clima/aviso';
import { etiquetaClima } from '../dominio/clima/codigos';
import type { Lugar } from '../dominio/recordatorio';
import { useClima, type Clima } from '../estado/useClima';
import './ClimaRecordatorio.css';

const DIA_Y_MES = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long', timeZone: 'UTC' });

const comoFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Los estados se pintan aparte para poder probarlos todos sin red ni reloj. */
export function VistaClima({ clima, alAireLibre }: { clima: Clima; alAireLibre: boolean }) {
  if (clima.estado === 'cargando') {
    return <p className="clima clima--nota">Consultando el clima…</p>;
  }

  if (clima.estado === 'fuera-de-ventana') {
    return (
      <p className="clima clima--nota">
        {clima.ventana.tipo === 'futuro'
          ? `Pronóstico disponible a partir del ${DIA_Y_MES.format(comoFecha(clima.ventana.disponibleDesde))}`
          : 'Ya no hay datos del clima para esa fecha'}
      </p>
    );
  }

  const pronostico = clima.pronostico;

  // Ningún estado deja la caja vacía: si no hay pronóstico, se dice por qué.
  if (pronostico.tipo === 'error') {
    return <p className="clima clima--nota">No se pudo consultar el clima</p>;
  }
  if (pronostico.tipo === 'sin-datos') {
    return <p className="clima clima--nota">No hay datos del clima para ese día</p>;
  }
  if (pronostico.tipo === 'fuera-de-rango') {
    return <p className="clima clima--nota">La API no tiene pronóstico para esa fecha</p>;
  }

  const aviso = avisoLluvia(alAireLibre, pronostico);

  return (
    <div className="clima">
      <p className="clima__linea">
        <span className="clima__condicion">{etiquetaClima(pronostico.codigo)}</span>
        <span className="clima__temperaturas">
          {Math.round(pronostico.max)}° / {Math.round(pronostico.min)}°
        </span>
        {pronostico.probLluvia !== null && (
          <span className="clima__lluvia">{pronostico.probLluvia} % de lluvia</span>
        )}
      </p>

      {aviso && (
        <p className="clima__aviso" role="status">
          {aviso.motivo === 'probabilidad'
            ? `Lleva paraguas: ${aviso.valor} % de probabilidad de lluvia`
            : `Lleva paraguas: se espera ${etiquetaClima(aviso.valor).toLowerCase()}`}
        </p>
      )}
    </div>
  );
}

interface Props {
  lugar: Lugar | null;
  fecha: string;
  alAireLibre: boolean;
  opciones?: Parameters<typeof useClima>[2];
}

export default function ClimaRecordatorio({ lugar, fecha, alAireLibre, opciones }: Props) {
  const clima = useClima(lugar, fecha, opciones);
  return <VistaClima clima={clima} alAireLibre={alAireLibre} />;
}
