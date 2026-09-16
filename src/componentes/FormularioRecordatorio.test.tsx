import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormularioRecordatorio from './FormularioRecordatorio';

const SANTO_DOMINGO = {
  nombre: 'Santo Domingo',
  provincia: 'Distrito Nacional',
  pais: 'DO',
  latitud: 18.4861,
  longitud: -69.9312,
  zonaHoraria: 'America/Santo_Domingo',
};

const pintar = () => {
  const onGuardar = vi.fn();
  const buscar = vi.fn(async () => ({ tipo: 'ok' as const, lugares: [SANTO_DOMINGO] }));
  render(<FormularioRecordatorio fecha="2026-09-20" onGuardar={onGuardar} buscar={buscar} />);
  return { onGuardar };
};

const elegirLugar = async () => {
  await userEvent.type(screen.getByLabelText('Lugar'), 'Santo');
  await userEvent.click(await screen.findByRole('button', { name: /Santo Domingo/ }));
};

const guardar = () => userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

describe('FormularioRecordatorio', () => {
  it('acepta exactamente 30 caracteres y los va contando', async () => {
    const { onGuardar } = pintar();
    await userEvent.type(screen.getByLabelText('Recordatorio'), 'a'.repeat(30));
    expect(screen.getByText('30/30')).toBeInTheDocument();

    await elegirLugar();
    await guardar();

    expect(onGuardar).toHaveBeenCalledWith(
      expect.objectContaining({ texto: 'a'.repeat(30), fecha: '2026-09-20', lugar: SANTO_DOMINGO })
    );
  });

  it('rechaza 31 y no guarda', async () => {
    const { onGuardar } = pintar();
    await userEvent.type(screen.getByLabelText('Recordatorio'), 'a'.repeat(31));
    await elegirLugar();
    await guardar();

    expect(screen.getByText('Máximo 30 caracteres.')).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('sin un lugar de la lista no guarda', async () => {
    const { onGuardar } = pintar();
    await userEvent.type(screen.getByLabelText('Recordatorio'), 'Playa');
    await guardar();

    expect(screen.getByText('Elige un lugar de la lista.')).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('deja agendar en el pasado: los campos no tienen mínimo', () => {
    pintar();
    expect(screen.getByLabelText('Fecha')).not.toHaveAttribute('min');
    expect(screen.getByLabelText('Hora')).not.toHaveAttribute('min');
  });
});
