import { describe, it, expect } from 'vitest';
import { avisoLluvia } from './aviso';

const ok = (codigo: number, probLluvia: number | null) => ({ tipo: 'ok' as const, codigo, max: 30, min: 22, probLluvia });

describe('avisoLluvia', () => {
  it('solo avisa en planes al aire libre', () => {
    expect(avisoLluvia(false, ok(61, 90))).toBeNull();
  });

  it('avisa por probabilidad, desde el umbral inclusive', () => {
    expect(avisoLluvia(true, ok(1, 50))).toEqual({ motivo: 'probabilidad', valor: 50 });
    expect(avisoLluvia(true, ok(1, 49))).toBeNull();
  });

  it('avisa por código aunque la probabilidad sea baja o falte', () => {
    expect(avisoLluvia(true, ok(95, null))).toEqual({ motivo: 'codigo', valor: 95 });
  });

  it('sin pronóstico no avisa nada', () => {
    expect(avisoLluvia(true, { tipo: 'error' })).toBeNull();
    expect(avisoLluvia(true, { tipo: 'sin-datos' })).toBeNull();
  });

  it('el umbral es configurable', () => {
    expect(avisoLluvia(true, ok(1, 30), 30)).toEqual({ motivo: 'probabilidad', valor: 30 });
  });
});
