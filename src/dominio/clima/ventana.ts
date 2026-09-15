import { sumarDias } from '../fechas';

export const DIAS_ADELANTE = 16;
export const DIAS_ATRAS = 92;

export type Ventana =
  | { tipo: 'disponible' }
  | { tipo: 'futuro'; disponibleDesde: string }
  | { tipo: 'pasado' };

export function estadoVentana(fecha: string, hoy: string): Ventana {
  if (fecha > sumarDias(hoy, DIAS_ADELANTE)) {
    return { tipo: 'futuro', disponibleDesde: sumarDias(fecha, -DIAS_ADELANTE) };
  }
  if (fecha < sumarDias(hoy, -DIAS_ATRAS)) return { tipo: 'pasado' };
  return { tipo: 'disponible' };
}
