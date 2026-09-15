export const MAX_TEXTO = 30;

export interface Lugar {
  nombre: string;
  provincia?: string;
  pais: string;
  latitud: number;
  longitud: number;
  zonaHoraria: string;
}

export interface Recordatorio {
  id: string;
  texto: string;
  fecha: string;
  hora: string;
  lugar: Lugar | null;
  color: string;
  alAireLibre: boolean;
}

export type Errores = Partial<Record<'texto' | 'fecha' | 'hora' | 'lugar', string>>;

const fechaReal = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
};

export function validarRecordatorio(r: Recordatorio): Errores {
  const errores: Errores = {};
  const largo = Array.from(r.texto.trim()).length;
  if (largo === 0) errores.texto = 'Escribe el recordatorio.';
  else if (largo > MAX_TEXTO) errores.texto = `Máximo ${MAX_TEXTO} caracteres.`;
  if (!fechaReal(r.fecha)) errores.fecha = 'Elige una fecha válida.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.hora)) errores.hora = 'Elige una hora válida.';
  if (!r.lugar) errores.lugar = 'Elige un lugar de la lista.';
  return errores;
}
