import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClimaRecordatorio, { VistaClima } from './ClimaRecordatorio';
import type { Clima } from '../estado/useClima';

const SANTO_DOMINGO = {
  nombre: 'Santo Domingo',
  pais: 'DO',
  latitud: 18.4861,
  longitud: -69.9312,
  zonaHoraria: 'America/Santo_Domingo',
};

const listo = (codigo: number, probLluvia: number | null = 10): Clima => ({
  estado: 'listo',
  pronostico: { tipo: 'ok', codigo, max: 31.4, min: 23.1, probLluvia },
  consultadoA: Date.parse('2026-09-14T15:00:00Z'),
});

describe('VistaClima', () => {
  it('muestra la condición, las temperaturas y la probabilidad de lluvia', () => {
    render(<VistaClima clima={listo(51, 80)} alAireLibre={false} />);
    expect(screen.getByText('Llovizna ligera')).toBeInTheDocument();
    expect(screen.getByText('31° / 23°')).toBeInTheDocument();
    expect(screen.getByText('80 % de lluvia')).toBeInTheDocument();
  });

  it('en un plan al aire libre avisa, y dice que fue por la probabilidad', () => {
    render(<VistaClima clima={listo(1, 80)} alAireLibre />);
    expect(screen.getByRole('status')).toHaveTextContent('Lleva paraguas: 80 % de probabilidad de lluvia');
  });

  it('avisa también por la condición, aunque la probabilidad sea baja', () => {
    render(<VistaClima clima={listo(95, 10)} alAireLibre />);
    expect(screen.getByRole('status')).toHaveTextContent('Lleva paraguas: se espera tormenta');
  });

  it('sin plan al aire libre no avisa', () => {
    render(<VistaClima clima={listo(95, 90)} alAireLibre={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('más allá de la ventana dice desde cuándo habrá pronóstico', () => {
    const clima: Clima = { estado: 'fuera-de-ventana', ventana: { tipo: 'futuro', disponibleDesde: '2026-09-24' } };
    render(<VistaClima clima={clima} alAireLibre={false} />);
    expect(screen.getByText('Pronóstico disponible a partir del 24 de septiembre')).toBeInTheDocument();
  });

  it('el pasado lejano lo dice, no deja la caja vacía', () => {
    const clima: Clima = { estado: 'fuera-de-ventana', ventana: { tipo: 'pasado' } };
    render(<VistaClima clima={clima} alAireLibre={false} />);
    expect(screen.getByText('Ya no hay datos del clima para esa fecha')).toBeInTheDocument();
  });

  it('un fallo de la consulta lo dice', () => {
    const clima: Clima = { estado: 'listo', pronostico: { tipo: 'error' }, consultadoA: 0 };
    render(<VistaClima clima={clima} alAireLibre={false} />);
    expect(screen.getByText('No se pudo consultar el clima')).toBeInTheDocument();
  });

  it('un día que la API acepta pero no tiene lo dice', () => {
    const clima: Clima = { estado: 'listo', pronostico: { tipo: 'sin-datos' }, consultadoA: 0 };
    render(<VistaClima clima={clima} alAireLibre={false} />);
    expect(screen.getByText('No hay datos del clima para ese día')).toBeInTheDocument();
  });

  it('si la API dice que la fecha está fuera de rango, manda la API', () => {
    const clima: Clima = {
      estado: 'listo',
      pronostico: { tipo: 'fuera-de-rango', motivo: "Parameter 'start_date' is out of allowed range" },
      consultadoA: 0,
    };
    render(<VistaClima clima={clima} alAireLibre={false} />);
    expect(screen.getByText('La API no tiene pronóstico para esa fecha')).toBeInTheDocument();
  });

  it('mientras carga lo dice, nunca una caja vacía', () => {
    render(<VistaClima clima={{ estado: 'cargando' }} alAireLibre={false} />);
    expect(screen.getByText('Consultando el clima…')).toBeInTheDocument();
  });
});

describe('ClimaRecordatorio', () => {
  it('consulta por el lugar y la fecha del recordatorio', async () => {
    const pedir = vi.fn(async () => ({ tipo: 'ok' as const, codigo: 0, max: 32, min: 24, probLluvia: 5 }));
    render(
      <ClimaRecordatorio
        lugar={SANTO_DOMINGO}
        fecha="2026-09-20"
        alAireLibre={false}
        opciones={{ pedir, hoy: '2026-09-14' }}
      />
    );
    expect(await screen.findByText('Despejado')).toBeInTheDocument();
    expect(pedir).toHaveBeenCalledWith(SANTO_DOMINGO, '2026-09-20');
  });
});
