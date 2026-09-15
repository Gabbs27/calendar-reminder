const TABLA: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna densa',
  56: 'Llovizna helada ligera',
  57: 'Llovizna helada densa',
  61: 'Lluvia leve',
  63: 'Lluvia moderada',
  65: 'Lluvia fuerte',
  66: 'Lluvia helada ligera',
  67: 'Lluvia helada fuerte',
  71: 'Nevada leve',
  73: 'Nevada moderada',
  75: 'Nevada fuerte',
  77: 'Granos de nieve',
  80: 'Chubascos leves',
  81: 'Chubascos moderados',
  82: 'Chubascos violentos',
  85: 'Chubascos de nieve leves',
  86: 'Chubascos de nieve fuertes',
  95: 'Tormenta',
  96: 'Tormenta con granizo leve',
  99: 'Tormenta con granizo fuerte',
};

export const CODIGOS_DOCUMENTADOS = Object.keys(TABLA).map(Number);

export const etiquetaClima = (codigo: number) => TABLA[codigo] ?? 'Desconocido';

// Nieve (71–77, 85–86) no es lluvia para el aviso; en RD no aplica, pero no se inventa.
export const esPrecipitacion = (c: number) =>
  (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;
