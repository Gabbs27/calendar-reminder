import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { CLAVE } from './dominio/almacen';
import { limpiarCacheClima } from './estado/useClima';

const SANTO_DOMINGO = {
  nombre: 'Santo Domingo',
  provincia: 'Distrito Nacional',
  pais: 'DO',
  latitud: 18.4861,
  longitud: -69.9312,
  zonaHoraria: 'America/Santo_Domingo',
};

const memoria = (inicial: Record<string, string> = {}) => {
  const datos = { ...inicial };
  return {
    getItem: (k: string) => (k in datos ? datos[k] : null),
    setItem: (k: string, v: string) => {
      datos[k] = v;
    },
    datos,
  };
};

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

const pintar = (storage = memoria()) => {
  limpiarCacheClima();
  const buscar = vi.fn(async () => ({ tipo: 'ok' as const, lugares: [SANTO_DOMINGO] }));
  const pedirClima = vi.fn(async () => ({ tipo: 'ok' as const, codigo: 61, max: 31, min: 23, probLluvia: 80 }));
  render(
    <App storage={storage} hoy="2026-09-14" buscar={buscar} pedirClima={pedirClima} nuevoId={ids()} />
  );
  return { storage, buscar, pedirClima };
};

const celdaDel20 = () => screen.getByRole('gridcell', { name: /^20 de septiembre de 2026/ });

const crearPlaya = async () => {
  await userEvent.click(screen.getByRole('gridcell', { name: '20 de septiembre de 2026' }));
  await userEvent.click(screen.getByRole('button', { name: 'Nuevo recordatorio' }));
  await userEvent.type(screen.getByLabelText('Recordatorio'), 'Playa');
  await userEvent.click(screen.getByLabelText('Plan al aire libre'));
  await userEvent.type(screen.getByLabelText('Lugar'), 'Santo');
  await userEvent.click(await screen.findByRole('button', { name: /Santo Domingo/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
};

describe('App', () => {
  it('crear un recordatorio lo deja en su celda, con el clima de su lugar y su fecha', async () => {
    const { storage, pedirClima } = pintar();

    await crearPlaya();

    expect(within(celdaDel20()).getByRole('button', { name: /^Playa/ })).toBeInTheDocument();
    expect(await screen.findByText('Lluvia leve')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Lleva paraguas');
    expect(pedirClima).toHaveBeenCalledWith(SANTO_DOMINGO, '2026-09-20');
    expect(JSON.parse(storage.datos[CLAVE]).recordatorios).toHaveLength(1);
  });

  it('editar cambia el recordatorio sin duplicarlo, y borrar lo quita', async () => {
    const { storage } = pintar();
    await crearPlaya();

    await userEvent.click(screen.getByRole('button', { name: 'Editar Playa' }));
    await userEvent.clear(screen.getByLabelText('Recordatorio'));
    await userEvent.type(screen.getByLabelText('Recordatorio'), 'Cine');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(within(celdaDel20()).getByRole('button', { name: /^Cine/ })).toBeInTheDocument();
    const guardados = JSON.parse(storage.datos[CLAVE]).recordatorios;
    expect(guardados).toHaveLength(1);
    expect(guardados[0].id).toBe('id-1');

    await userEvent.click(screen.getByRole('button', { name: 'Borrar Cine' }));

    expect(within(celdaDel20()).queryByRole('button', { name: /^Cine/ })).not.toBeInTheDocument();
    expect(JSON.parse(storage.datos[CLAVE]).recordatorios).toEqual([]);
  });

  it('si lo guardado no se puede leer, lo dice y no lo sobrescribe', async () => {
    const { storage } = pintar(memoria({ [CLAVE]: '{roto' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudieron leer/i);

    await userEvent.click(screen.getByRole('gridcell', { name: '20 de septiembre de 2026' }));
    expect(screen.queryByRole('button', { name: 'Nuevo recordatorio' })).not.toBeInTheDocument();
    expect(storage.datos[CLAVE]).toBe('{roto');
  });
});
