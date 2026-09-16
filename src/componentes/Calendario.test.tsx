import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calendario from './Calendario';
import type { Recordatorio } from '../dominio/recordatorio';

const lugar = {
  nombre: 'Santo Domingo',
  pais: 'DO',
  latitud: 18.4861,
  longitud: -69.9312,
  zonaHoraria: 'America/Santo_Domingo',
};

const recordatorio = (id: string, fecha: string, texto: string): Recordatorio => ({
  id,
  texto,
  fecha,
  hora: '09:00',
  lugar,
  color: 'verde',
  alAireLibre: true,
});

const pintar = (recordatorios: Recordatorio[] = []) => {
  const onAbrirDia = vi.fn();
  const onAbrirRecordatorio = vi.fn();
  render(
    <Calendario
      recordatorios={recordatorios}
      hoy="2026-09-14"
      mesInicial={{ anio: 2026, mes: 9 }}
      onAbrirDia={onAbrirDia}
      onAbrirRecordatorio={onAbrirRecordatorio}
    />
  );
  return { onAbrirDia, onAbrirRecordatorio };
};

describe('Calendario', () => {
  it('cambia de mes — regresión del fallo de 2023', async () => {
    pintar();
    expect(screen.getByRole('gridcell', { name: '30 de septiembre de 2026' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }));

    expect(screen.getByRole('heading', { name: 'octubre de 2026' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: '1 de octubre de 2026' })).toBeInTheDocument();
    expect(screen.queryByRole('gridcell', { name: '30 de septiembre de 2026' })).not.toBeInTheDocument();
  });

  it('vuelve al mes de hoy', async () => {
    pintar();
    await userEvent.click(screen.getByRole('button', { name: 'Mes anterior' }));
    expect(screen.getByRole('heading', { name: 'agosto de 2026' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Hoy' }));
    expect(screen.getByRole('heading', { name: 'septiembre de 2026' })).toBeInTheDocument();
  });

  it('un recordatorio del día 5 está en la celda del día 5 — regresión del fallo de 2023', async () => {
    const { onAbrirRecordatorio } = pintar([recordatorio('1', '2026-09-05', 'Playa')]);
    const celda = screen.getByRole('gridcell', { name: /^5 de septiembre de 2026/ });
    const boton = within(celda).getByRole('button', { name: /^Playa/ });

    await userEvent.click(boton);

    expect(onAbrirRecordatorio).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });

  it('muestra tres recordatorios y el resto detrás de «+2 más»', async () => {
    const { onAbrirDia } = pintar(
      [1, 2, 3, 4, 5].map((n) => recordatorio(String(n), '2026-09-10', `Plan ${n}`))
    );
    const celda = screen.getByRole('gridcell', { name: /^10 de septiembre de 2026/ });
    expect(within(celda).getAllByRole('button', { name: /^Plan/ })).toHaveLength(3);

    await userEvent.click(within(celda).getByRole('button', { name: '+2 más' }));

    expect(onAbrirDia).toHaveBeenCalledWith('2026-09-10');
  });

  it('las flechas mueven el foco entre días', async () => {
    pintar();
    screen.getByRole('gridcell', { name: '5 de septiembre de 2026' }).focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('gridcell', { name: '6 de septiembre de 2026' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('gridcell', { name: '13 de septiembre de 2026' })).toHaveFocus();
  });
});
