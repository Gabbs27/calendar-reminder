import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BuscadorLugar from './BuscadorLugar';
import type { Busqueda } from '../dominio/lugares';

const SANTIAGO = {
  nombre: 'Santiago de los Caballeros',
  provincia: 'Provincia de Santiago',
  pais: 'DO',
  latitud: 19.45036,
  longitud: -70.69085,
  zonaHoraria: 'America/Santo_Domingo',
};

const pintar = (respuesta: Busqueda) => {
  const buscar = vi.fn(async () => respuesta);
  const onElegir = vi.fn();
  render(<BuscadorLugar valor={null} onElegir={onElegir} buscar={buscar} />);
  return { buscar, onElegir };
};

describe('BuscadorLugar', () => {
  it('busca en RD por defecto, y en todo el mundo con el interruptor', async () => {
    const { buscar } = pintar({ tipo: 'ok', lugares: [SANTIAGO] });

    await userEvent.type(screen.getByLabelText('Lugar'), 'Santiago');
    await screen.findByRole('button', { name: /Santiago de los Caballeros/ });
    expect(buscar).toHaveBeenLastCalledWith('Santiago', { pais: 'DO' });

    await userEvent.click(screen.getByLabelText('Buscar en todo el mundo'));
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith('Santiago', { pais: null }));
  });

  it('sin coincidencias lo dice', async () => {
    pintar({ tipo: 'ok', lugares: [] });
    await userEvent.type(screen.getByLabelText('Lugar'), 'Xqzvtlandia');
    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
  });

  it('no poder buscar no es lo mismo que no encontrar nada', async () => {
    pintar({ tipo: 'error' });
    await userEvent.type(screen.getByLabelText('Lugar'), 'Santiago');
    expect(await screen.findByText(/No se pudo buscar/)).toBeInTheDocument();
    expect(screen.queryByText('Sin resultados')).not.toBeInTheDocument();
  });

  it('cada opción muestra nombre, provincia y país, y devuelve el lugar completo', async () => {
    const { onElegir } = pintar({ tipo: 'ok', lugares: [SANTIAGO] });
    await userEvent.type(screen.getByLabelText('Lugar'), 'Santiago');

    const opcion = await screen.findByRole('button', { name: /Santiago de los Caballeros/ });
    expect(opcion).toHaveAccessibleName('Santiago de los Caballeros, Provincia de Santiago, República Dominicana');

    await userEvent.click(opcion);
    expect(onElegir).toHaveBeenCalledWith(SANTIAGO);
  });
});
