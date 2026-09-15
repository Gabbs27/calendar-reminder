import { esPrecipitacion } from './codigos';
import type { Pronostico } from './pronostico';

// El 50% es una decisión de producto, no una regla meteorológica: por eso es un
// parámetro, y por eso el aviso dice qué lo disparó.
export const UMBRAL_LLUVIA = 50;

export function avisoLluvia(alAireLibre: boolean, p: Pronostico, umbral = UMBRAL_LLUVIA) {
  if (!alAireLibre || p.tipo !== 'ok') return null;
  if (esPrecipitacion(p.codigo)) return { motivo: 'codigo' as const, valor: p.codigo };
  if (p.probLluvia !== null && p.probLluvia >= umbral) return { motivo: 'probabilidad' as const, valor: p.probLluvia };
  return null;
}
