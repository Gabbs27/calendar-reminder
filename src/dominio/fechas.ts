const DIA_MS = 86_400_000;

const partes = (iso: string) => iso.split('-').map(Number) as [number, number, number];
const aISO = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = partes(iso);
  return aISO(Date.UTC(a, m - 1, d) + dias * DIA_MS);
}

/** Celdas de la cuadrícula de un mes (mes 1–12). `null` es un hueco antes del día 1. */
export function celdasDelMes(anio: number, mes: number, inicioSemana = 0): (string | null)[] {
  const primero = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  const huecos = (primero - inicioSemana + 7) % 7;
  const dias = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const celdas: (string | null)[] = Array(huecos).fill(null);
  for (let d = 1; d <= dias; d++) {
    celdas.push(`${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return celdas;
}

/** Filtra por fecha ISO completa. Nunca por número de día: ese fue el fallo de 2023. */
export function recordatoriosDelDia<T extends { fecha: string }>(lista: T[], fecha: string): T[] {
  return lista.filter((r) => r.fecha === fecha);
}

/** Hoy en la zona horaria dada, como AAAA-MM-DD. */
export function hoyEn(zonaHoraria: string, ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zonaHoraria }).format(ahora);
}
