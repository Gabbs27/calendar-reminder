# Agenda con clima — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `calendar-reminder` as a static weather agenda on Vercel, and republish the 2023 Jobsity challenge beside it exactly as it was delivered.

**Architecture:** Vite + React + TypeScript with no server. The domain (dates, reminder validation, storage, weather window, WMO codes, Open-Meteo clients, rain warning) is pure TypeScript under `src/dominio/` and is written test-first before any component. Reminders live in `localStorage` under a versioned schema; places are stored by coordinates; weather is fetched per place and date, never stored inside a reminder.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, Open-Meteo forecast and geocoding APIs (no key, CORS `*`), Vercel CLI.

**Design:** `docs/plans/2026-09-14-agenda-con-clima-design.md`

---

## Ground rules for whoever executes this

1. **Git identity.** Before every commit, `git config --local user.email` must print `gabbs27@users.noreply.github.com`. If it does not, stop and ask. Never use the global identity: it is Gabriel's work account. Commits carry no `Co-Authored-By` line.
2. **Every guard is checked in both directions, in the same sitting.** Red on the broken state, green on the fixed one. A test that has only ever been seen passing proves nothing.
3. **Never invent an API field.** Every field name, parameter and error string for Open-Meteo in this plan was observed on 2026-09-14. If the live API disagrees, the API wins: stop, record what it returned, and adjust.
4. **The 2023 artifact is never modified.** Not rebuilt, not patched, not "cleaned up". If a task seems to require changing it, the task is wrong.
5. **Commit after each task.**

---

## Task 0 — Revoke the OpenWeather key (Gabriel, BLOCKS Task 18 only)

The key is hardcoded in `src/api/weather.js` since `e75c103` and is inside the
published bundle `main.4282c633.js`. Deleting it from the code (Task 3) does not
remove it from git history.

1. Log in to OpenWeather → API keys → revoke the key used by this repo.
2. Tell the executing session it is done.

Every other task can proceed without this. Task 18 republishes the 2023 bundle, key
included, and must not run while the key is alive.

---

## Phase 1 — Freeze 2023 before touching anything

### Task 1: Tag the challenge and its published build

**Order matters:** this runs before Task 3 deletes the 2023 source, and before
Task 19 replaces `gh-pages`, which would leave the 2023 build reachable only by an
untagged commit.

**Step 1: Confirm the commits are the ones the design names**

```bash
git log -1 --format='%H %ad %s' --date=short dc9230d
git log -1 --format='%H %ad %s' --date=short d356e92
git ls-tree -r --name-only d356e92 | wc -l
```

Expected: `dc9230d… 2023-01-26 Merge pull request #3 from Gabbs27/developer`,
`d356e92… 2023-01-27 Updates`, and `12`.

**Step 2: Tag both**

```bash
git tag -a v2023-jobsity dc9230d -m "Jobsity React challenge, as delivered on 2023-01-26"
git tag -a v2023-jobsity-build d356e92 -m "The build published to GitHub Pages on 2023-01-27"
git push origin v2023-jobsity v2023-jobsity-build
```

**Step 3: Verify on GitHub**

```bash
gh api repos/Gabbs27/calendar-reminder/tags --jq '.[].name'
```

Expected: both tags listed.

No commit: tags are the deliverable.

---

### Task 2: Script that reproduces the 2023 site byte for byte

**Files:**
- Create: `scripts/publicar-2023.sh`

**Step 1: Write the script**

```bash
#!/usr/bin/env bash
# Rebuilds the 2023 site folder from the tagged GitHub Pages build and proves it
# is byte-identical before anything is deployed.
#
# It does not compile anything. The point of the 2023 site is to show what was
# delivered; a fresh build of that source today is a different artifact.
#
# Its index.html loads JS and CSS from /calendar-reminder/static/..., an absolute
# path, so the files are served under /calendar-reminder/ and / redirects there.
#
#   bash scripts/publicar-2023.sh <carpeta>                   # extrae y verifica
#   SOLO_VERIFICAR=1 bash scripts/publicar-2023.sh <carpeta>  # verifica lo que ya hay
set -euo pipefail

BUILD=v2023-jobsity-build
ESPERADOS=12
RAIZ="$(git rev-parse --show-toplevel)"
DEST="${1:?Uso: publicar-2023.sh <carpeta>}"

if [ -z "${SOLO_VERIFICAR:-}" ]; then
  rm -rf "$DEST/calendar-reminder"
  mkdir -p "$DEST/calendar-reminder"
  git -C "$RAIZ" archive "$BUILD" | tar -x -C "$DEST/calendar-reminder"
fi

n=0
while IFS=$'\t' read -r meta ruta; do
  hash=$(echo "$meta" | awk '{print $3}')
  real=$(git -C "$RAIZ" hash-object "$DEST/calendar-reminder/$ruta")
  if [ "$real" != "$hash" ]; then
    echo "DIFIERE del build de 2023: $ruta" >&2
    exit 1
  fi
  n=$((n + 1))
done < <(git -C "$RAIZ" ls-tree -r "$BUILD")

if [ "$n" -ne "$ESPERADOS" ]; then
  echo "Esperaba $ESPERADOS archivos, hay $n" >&2
  exit 1
fi

cat > "$DEST/vercel.json" <<'JSON'
{
  "redirects": [
    { "source": "/", "destination": "/calendar-reminder/", "permanent": false }
  ]
}
JSON

echo "$n archivos idénticos al build de 2023 en $DEST"
```

**Step 2: Run it**

Run: `bash scripts/publicar-2023.sh /tmp/sitio-2023`
Expected: `12 archivos idénticos al build de 2023 en /tmp/sitio-2023`

**Step 3: Prove the check can fail**

```bash
echo " " >> /tmp/sitio-2023/calendar-reminder/robots.txt
SOLO_VERIFICAR=1 bash scripts/publicar-2023.sh /tmp/sitio-2023; echo "exit $?"
```

Expected: `DIFIERE del build de 2023: robots.txt` and `exit 1`.

```bash
bash scripts/publicar-2023.sh /tmp/sitio-2023; echo "exit $?"
```

Expected: `12 archivos idénticos…` and `exit 0`. The extraction replaced the tampered
file; the verification had to be seen failing before this green counts.

**Step 4: Commit**

```bash
git add scripts/publicar-2023.sh
git commit -m "chore: reproduce the 2023 site byte for byte from its tagged build"
```

---

## Phase 2 — Scaffold

### Task 3: Replace Create React App with Vite + React + TypeScript

Runs only after Task 1. The 2023 source is preserved by `v2023-jobsity`.

**Files:**
- Delete: `src/`, `public/`, `package-lock.json`, `README.md`
- Rewrite: `package.json`, `.gitignore`
- Create: `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`

**Step 1: Remove the old app**

```bash
git rm -r -q src public package-lock.json README.md
rm -rf node_modules
```

**Step 2: Write `package.json`**

```json
{
  "name": "calendar-reminder",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 3: Install**

```bash
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom \
  vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Step 4: Config files**

`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
});
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
```

`index.html`:

```html
<!doctype html>
<html lang="es-DO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agenda con clima</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

`src/App.tsx`:

```tsx
export default function App() {
  return <h1>Agenda con clima</h1>;
}
```

Append `dist` to `.gitignore`.

If a current major version of Vite or Vitest rejects any of these files, follow that
tool's current docs, and name the deviation in the commit message.

**Step 5: Verify**

Run: `npm run build && npx vitest run --passWithNoTests`
Expected: build succeeds; vitest reports no test files.

Also run: `git grep -nE '[a-f0-9]{32}' -- . ':!docs'` — expected: no output. The key
must no longer be in the working tree.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: replace Create React App with Vite, React and TypeScript"
```

---

## Phase 3 — The domain, test-first

Pure TypeScript under `src/dominio/`. No React, no `fetch` global, no `localStorage`
global: collaborators are passed in, so every test runs without a browser.

### Task 4: Dates and the month grid

The 2023 app stored `moment(date).format('DD')` (`"05"`) and matched it against
`day.toString()` (`"5"`), so reminders on days 1–9 never rendered. The fix is not a
padding tweak: reminders are matched by full ISO date, never by day number.

Weeks start on Sunday, as they did in 2023, so the two sites compare cell for cell.

**Files:**
- Create: `src/dominio/fechas.ts`
- Test: `src/dominio/fechas.test.ts`

**Step 1: Failing test**

The two month fixtures are not assumptions: the 2023 app, screenshotted in
September 2026, drew the 1st under Tuesday; the portfolio screenshot from February
2023 drew the 1st under Wednesday with 28 days.

```ts
import { describe, it, expect } from 'vitest';
import { celdasDelMes, sumarDias, recordatoriosDelDia } from './fechas';

describe('celdasDelMes', () => {
  it('septiembre 2026: empieza martes, 30 días', () => {
    const celdas = celdasDelMes(2026, 9);
    expect(celdas.slice(0, 2)).toEqual([null, null]);
    expect(celdas[2]).toBe('2026-09-01');
    expect(celdas.filter(Boolean)).toHaveLength(30);
  });

  it('febrero 2023: empieza miércoles, 28 días', () => {
    const celdas = celdasDelMes(2023, 2);
    expect(celdas.slice(0, 3)).toEqual([null, null, null]);
    expect(celdas[3]).toBe('2023-02-01');
    expect(celdas.filter(Boolean)).toHaveLength(28);
  });

  it('febrero 2024 es bisiesto', () => {
    expect(celdasDelMes(2024, 2).filter(Boolean)).toHaveLength(29);
  });
});

describe('sumarDias', () => {
  it('cruza meses y años sin depender de la zona horaria de la máquina', () => {
    expect(sumarDias('2026-09-14', 16)).toBe('2026-09-30');
    expect(sumarDias('2026-09-14', -92)).toBe('2026-06-14');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('recordatoriosDelDia — regresión del fallo de 2023', () => {
  const r = (fecha: string) => ({ id: fecha, fecha });

  it('un recordatorio el día 5 aparece el día 5', () => {
    expect(recordatoriosDelDia([r('2026-09-05')], '2026-09-05')).toHaveLength(1);
  });

  it('el 5 de septiembre no aparece el 5 de octubre', () => {
    expect(recordatoriosDelDia([r('2026-09-05')], '2026-10-05')).toHaveLength(0);
  });
});
```

**Step 2: Run and watch it fail** — `npx vitest run src/dominio/fechas.test.ts`, FAIL: cannot resolve `./fechas`.

**Step 3: Implement**

```ts
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
```

**Step 4: Prove the regression test can fail.** Temporarily change
`recordatoriosDelDia` to compare `Number(r.fecha.slice(8)).toString() === fecha.slice(8)`
(the 2023 shape). The day-5 test must go red. Restore, confirm green.

**Step 5: Commit** — `git commit -m "feat(dominio): month grid and date matching by full ISO date"`

---

### Task 5: Reminder validation

The 2023 form validated `value.length < 30` with `maxLength={30}`: a 30-character
reminder could be typed and never saved. The challenge said *max. 30 characters*.

**Files:**
- Create: `src/dominio/recordatorio.ts`
- Test: `src/dominio/recordatorio.test.ts`

**Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { validarRecordatorio, type Recordatorio } from './recordatorio';

const lugar = {
  nombre: 'Santiago de los Caballeros',
  provincia: 'Provincia de Santiago',
  pais: 'DO',
  latitud: 19.45036,
  longitud: -70.69085,
  zonaHoraria: 'America/Santo_Domingo',
};

const base: Recordatorio = {
  id: '1',
  texto: 'Playa',
  fecha: '2026-09-20',
  hora: '09:00',
  lugar,
  color: 'verde',
  alAireLibre: true,
};

describe('validarRecordatorio', () => {
  it('acepta exactamente 30 caracteres', () => {
    expect(validarRecordatorio({ ...base, texto: 'a'.repeat(30) })).toEqual({});
  });

  it('rechaza 31', () => {
    expect(validarRecordatorio({ ...base, texto: 'a'.repeat(31) }).texto).toMatch(/30/);
  });

  it('rechaza vacío y solo espacios', () => {
    expect(validarRecordatorio({ ...base, texto: '' }).texto).toBeTruthy();
    expect(validarRecordatorio({ ...base, texto: '   ' }).texto).toBeTruthy();
  });

  it('cuenta un emoji como un carácter', () => {
    expect(validarRecordatorio({ ...base, texto: '🌧'.repeat(30) })).toEqual({});
  });

  it('exige lugar, fecha válida y hora válida', () => {
    expect(validarRecordatorio({ ...base, lugar: null }).lugar).toBeTruthy();
    expect(validarRecordatorio({ ...base, fecha: '2026-02-30' }).fecha).toBeTruthy();
    expect(validarRecordatorio({ ...base, hora: '25:00' }).hora).toBeTruthy();
  });
});
```

**Step 2: Watch it fail.**

**Step 3: Implement**

```ts
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
```

**Step 4: Prove it.** Change `largo > MAX_TEXTO` to `largo >= MAX_TEXTO`; the 30-character test must go red. Restore.

**Step 5: Commit** — `git commit -m "feat(dominio): reminder validation, 30 characters inclusive"`

---

### Task 6: Storage that never destroys what it cannot read

**Files:**
- Create: `src/dominio/almacen.ts`
- Test: `src/dominio/almacen.test.ts`

**Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { crearAlmacen, CLAVE } from './almacen';

const memoria = (inicial: Record<string, string> = {}) => {
  const datos = { ...inicial };
  return {
    getItem: (k: string) => (k in datos ? datos[k] : null),
    setItem: (k: string, v: string) => { datos[k] = v; },
    datos,
  };
};

describe('almacén', () => {
  it('sin nada guardado arranca vacío', () => {
    expect(crearAlmacen(memoria()).cargar()).toEqual({ estado: 'ok', recordatorios: [] });
  });

  it('guarda y vuelve a cargar', () => {
    const s = memoria();
    const a = crearAlmacen(s);
    a.guardar([{ id: '1' } as never]);
    expect(crearAlmacen(s).cargar()).toEqual({ estado: 'ok', recordatorios: [{ id: '1' }] });
  });

  it('JSON corrupto: lo reporta y no lo sobrescribe', () => {
    const s = memoria({ [CLAVE]: '{roto' });
    const a = crearAlmacen(s);
    expect(a.cargar().estado).toBe('corrupto');
    expect(() => a.guardar([])).toThrow(/corrupto/i);
    expect(s.datos[CLAVE]).toBe('{roto');
  });

  it('una versión de esquema desconocida también es corrupto', () => {
    const s = memoria({ [CLAVE]: JSON.stringify({ version: 99, recordatorios: [] }) });
    expect(crearAlmacen(s).cargar().estado).toBe('corrupto');
  });
});
```

**Step 2: Watch it fail.**

**Step 3: Implement**

```ts
import type { Recordatorio } from './recordatorio';

export const CLAVE = 'agenda-con-clima';
export const VERSION = 1;

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

export type Carga =
  | { estado: 'ok'; recordatorios: Recordatorio[] }
  | { estado: 'corrupto'; crudo: string };

export function crearAlmacen(storage: Storage) {
  let corrupto = false;

  return {
    cargar(): Carga {
      const crudo = storage.getItem(CLAVE);
      if (crudo === null) return { estado: 'ok', recordatorios: [] };
      try {
        const datos = JSON.parse(crudo);
        if (datos?.version !== VERSION || !Array.isArray(datos.recordatorios)) throw new Error();
        corrupto = false;
        return { estado: 'ok', recordatorios: datos.recordatorios };
      } catch {
        corrupto = true;
        return { estado: 'corrupto', crudo };
      }
    },
    guardar(recordatorios: Recordatorio[]) {
      // Perder los recordatorios de alguien por un JSON inesperado es peor que no guardar.
      if (corrupto) throw new Error('Datos guardados corruptos: no se sobrescriben.');
      storage.setItem(CLAVE, JSON.stringify({ version: VERSION, recordatorios }));
    },
  };
}
```

**Step 4: Prove it.** Remove the `if (corrupto) throw` line; the corrupt test must go red because the raw value is overwritten. Restore.

**Step 5: Commit** — `git commit -m "feat(dominio): versioned storage that refuses to overwrite what it cannot read"`

---

### Task 7: WMO weather codes

**Files:**
- Create: `src/dominio/clima/codigos.ts`
- Test: `src/dominio/clima/codigos.test.ts`

The table below is Open-Meteo's documented WMO table, observed 2026-09-14. The docs
say 96 and 99 are only forecast in Central Europe; the API returned `96` for Santo
Domingo on 2026-09-01. Nothing is filtered by region.

**Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { etiquetaClima, esPrecipitacion, CODIGOS_DOCUMENTADOS } from './codigos';

describe('códigos WMO', () => {
  it('todos los códigos documentados tienen etiqueta', () => {
    for (const c of CODIGOS_DOCUMENTADOS) expect(etiquetaClima(c)).not.toBe('Desconocido');
  });

  it('96 existe aunque la doc lo limite a Centroeuropa', () => {
    expect(etiquetaClima(96)).toMatch(/granizo/i);
  });

  it('un código fuera de la tabla no rompe', () => {
    expect(etiquetaClima(42)).toBe('Desconocido');
  });

  it('llovizna, lluvia, chubascos y tormenta cuentan como precipitación; niebla no', () => {
    for (const c of [51, 61, 80, 95, 99]) expect(esPrecipitacion(c)).toBe(true);
    for (const c of [0, 3, 45, 71]) expect(esPrecipitacion(c)).toBe(false);
  });
});
```

**Step 3: Implement**

```ts
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
```

**Step 4: Prove it.** Delete the `96` row; the Central Europe test must go red. Restore.

**Step 5: Commit** — `git commit -m "feat(clima): WMO weather codes, all of them"`

---

### Task 8: The forecast window

Observed on 2026-09-14: the forecast API accepted dates from 2026-06-14 to
2026-09-30, and for 2026-10-10 answered
`Parameter 'start_date' is out of allowed range from 2026-06-14 to 2026-09-30`.
That is 92 days back and 16 ahead. These constants encode that observation, and the
API's own answer overrides them (Task 9).

**Files:**
- Create: `src/dominio/clima/ventana.ts`
- Test: `src/dominio/clima/ventana.test.ts`

**Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { estadoVentana } from './ventana';

const hoy = '2026-09-14';

describe('ventana de pronóstico', () => {
  it('los bordes observados están dentro', () => {
    expect(estadoVentana('2026-09-30', hoy)).toEqual({ tipo: 'disponible' });
    expect(estadoVentana('2026-06-14', hoy)).toEqual({ tipo: 'disponible' });
  });

  it('un día después del borde futuro dice desde cuándo habrá pronóstico', () => {
    expect(estadoVentana('2026-10-01', hoy)).toEqual({ tipo: 'futuro', disponibleDesde: '2026-09-15' });
    expect(estadoVentana('2026-10-10', hoy)).toEqual({ tipo: 'futuro', disponibleDesde: '2026-09-24' });
  });

  it('un día antes del borde pasado queda fuera', () => {
    expect(estadoVentana('2026-06-13', hoy)).toEqual({ tipo: 'pasado' });
  });
});
```

**Step 3: Implement**

```ts
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
```

ISO dates compare correctly as strings; that is why they are kept as strings.

**Step 4: Prove it.** Change `>` to `>=`; the 2026-09-30 edge must go red. Restore.

**Step 5: Commit** — `git commit -m "feat(clima): the forecast window, from observed API bounds"`

---

### Task 9: Forecast client that never throws

The 2023 thunk had no `rejected` case and the API wrapper swallowed errors into
`undefined`, which then passed a `!== null` check and crashed the next creation.
This client returns a value for every outcome and never throws.

**Files:**
- Create: `src/dominio/clima/pronostico.ts`
- Test: `src/dominio/clima/pronostico.test.ts`

**Step 1: Failing test** — fixtures copied from real responses on 2026-09-14.

```ts
import { describe, it, expect, vi } from 'vitest';
import { pronosticoDiario } from './pronostico';

const lugar = { latitud: 18.4861, longitud: -69.9312, zonaHoraria: 'America/Santo_Domingo' };

const respuesta = (cuerpo: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: async () => cuerpo });

describe('pronosticoDiario', () => {
  it('pide los campos y la fecha exactos', async () => {
    const f = respuesta({ daily: { weather_code: [51], temperature_2m_max: [30.6], temperature_2m_min: [23.2], precipitation_probability_max: [80] } });
    await pronosticoDiario(lugar, '2026-09-20', f);
    const url = new URL(f.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('daily')).toBe('weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    expect(url.searchParams.get('start_date')).toBe('2026-09-20');
    expect(url.searchParams.get('end_date')).toBe('2026-09-20');
    expect(url.searchParams.get('timezone')).toBe('America/Santo_Domingo');
  });

  it('devuelve el día pedido', async () => {
    const f = respuesta({ daily: { weather_code: [51], temperature_2m_max: [30.6], temperature_2m_min: [23.2], precipitation_probability_max: [80] } });
    expect(await pronosticoDiario(lugar, '2026-09-20', f)).toEqual({ tipo: 'ok', codigo: 51, max: 30.6, min: 23.2, probLluvia: 80 });
  });

  it('el error de rango de la API se vuelve fuera-de-rango, con su motivo', async () => {
    const f = respuesta({ error: true, reason: "Parameter 'start_date' is out of allowed range from 2026-06-14 to 2026-09-30" }, false);
    const r = await pronosticoDiario(lugar, '2026-10-10', f);
    expect(r).toEqual({ tipo: 'fuera-de-rango', motivo: expect.stringMatching(/out of allowed range/) });
  });

  it('un fallo de red no lanza — regresión del fallo de 2023', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(pronosticoDiario(lugar, '2026-09-20', f)).resolves.toEqual({ tipo: 'error' });
  });

  it('una respuesta sin daily no lanza', async () => {
    await expect(pronosticoDiario(lugar, '2026-09-20', respuesta({}))).resolves.toEqual({ tipo: 'error' });
  });
});
```

**Step 3: Implement**

```ts
export type Pronostico =
  | { tipo: 'ok'; codigo: number; max: number; min: number; probLluvia: number | null }
  | { tipo: 'fuera-de-rango'; motivo: string }
  | { tipo: 'error' };

type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const CAMPOS = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max';

export async function pronosticoDiario(
  lugar: { latitud: number; longitud: number; zonaHoraria: string },
  fecha: string,
  fetchImpl: Fetch = fetch
): Promise<Pronostico> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lugar.latitud));
  url.searchParams.set('longitude', String(lugar.longitud));
  url.searchParams.set('timezone', lugar.zonaHoraria);
  url.searchParams.set('daily', CAMPOS);
  url.searchParams.set('start_date', fecha);
  url.searchParams.set('end_date', fecha);

  try {
    const cuerpo = (await (await fetchImpl(url.toString())).json()) as any;
    if (cuerpo?.error) {
      return /out of allowed range/i.test(cuerpo.reason ?? '')
        ? { tipo: 'fuera-de-rango', motivo: cuerpo.reason }
        : { tipo: 'error' };
    }
    const d = cuerpo?.daily;
    if (!d || !Array.isArray(d.weather_code) || d.weather_code.length === 0) return { tipo: 'error' };
    return {
      tipo: 'ok',
      codigo: d.weather_code[0],
      max: d.temperature_2m_max[0],
      min: d.temperature_2m_min[0],
      probLluvia: d.precipitation_probability_max?.[0] ?? null,
    };
  } catch {
    return { tipo: 'error' };
  }
}
```

**Step 4: Prove it.** Remove the `try/catch`; the network test must go red. Restore.

**Step 5: Commit** — `git commit -m "feat(clima): forecast client that returns a value for every outcome"`

---

### Task 10: Place search

Observed 2026-09-14: `Santiago` without a country filter did not return Santiago de
los Caballeros in the first 20 results; with `countryCode=DO` it came first. A search
with no matches returned an object with **no `results` key**.

**Files:**
- Create: `src/dominio/lugares.ts`
- Test: `src/dominio/lugares.test.ts`

**Step 1: Failing test**

```ts
import { describe, it, expect, vi } from 'vitest';
import { buscarLugares } from './lugares';

const responde = (cuerpo: unknown) => vi.fn().mockResolvedValue({ ok: true, json: async () => cuerpo });

describe('buscarLugares', () => {
  it('filtra por RD cuando se pide', async () => {
    const f = responde({ results: [] });
    await buscarLugares('Santiago', { pais: 'DO' }, f);
    const url = new URL(f.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect(url.searchParams.get('countryCode')).toBe('DO');
    expect(url.searchParams.get('language')).toBe('es');
  });

  it('sin filtro no manda countryCode', async () => {
    const f = responde({ results: [] });
    await buscarLugares('Santiago', { pais: null }, f);
    expect(new URL(f.mock.calls[0][0]).searchParams.has('countryCode')).toBe(false);
  });

  it('una respuesta sin la clave results es una lista vacía', async () => {
    expect(await buscarLugares('Xqzvtlandia', { pais: null }, responde({ generationtime_ms: 0.4 }))).toEqual([]);
  });

  it('guarda coordenadas, provincia, país y zona horaria', async () => {
    const f = responde({ results: [{
      name: 'Santiago de los Caballeros', admin1: 'Provincia de Santiago', country_code: 'DO',
      latitude: 19.45036, longitude: -70.69085, timezone: 'America/Santo_Domingo',
    }] });
    expect(await buscarLugares('Santiago', { pais: 'DO' }, f)).toEqual([{
      nombre: 'Santiago de los Caballeros', provincia: 'Provincia de Santiago', pais: 'DO',
      latitud: 19.45036, longitud: -70.69085, zonaHoraria: 'America/Santo_Domingo',
    }]);
  });

  it('un fallo de red es una lista vacía, no una excepción', async () => {
    await expect(buscarLugares('x', { pais: 'DO' }, vi.fn().mockRejectedValue(new Error()))).resolves.toEqual([]);
  });
});
```

**Step 3: Implement**

```ts
import type { Lugar } from './recordatorio';

type Fetch = (url: string) => Promise<{ json(): Promise<unknown> }>;

export async function buscarLugares(
  nombre: string,
  { pais }: { pais: string | null },
  fetchImpl: Fetch = fetch
): Promise<Lugar[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', nombre);
  url.searchParams.set('count', '10');
  url.searchParams.set('language', 'es');
  if (pais) url.searchParams.set('countryCode', pais);

  try {
    const cuerpo = (await (await fetchImpl(url.toString())).json()) as any;
    // Sin coincidencias la API no manda `results: []`: no manda la clave.
    return (cuerpo?.results ?? []).map((r: any) => ({
      nombre: r.name,
      provincia: r.admin1,
      pais: r.country_code,
      latitud: r.latitude,
      longitud: r.longitude,
      zonaHoraria: r.timezone,
    }));
  } catch {
    return [];
  }
}
```

**Step 4: Prove it.** Replace `cuerpo?.results ?? []` with `cuerpo.results`; the no-results test must go red. Restore.

**Step 5: Commit** — `git commit -m "feat(lugares): place search by coordinates, filtered to RD by default"`

---

### Task 11: Rain warning

**The 50% threshold is a product decision, not a meteorological rule.** It is a
parameter, and the UI says what triggered the warning.

**Files:**
- Create: `src/dominio/clima/aviso.ts`
- Test: `src/dominio/clima/aviso.test.ts`

**Step 1: Failing test**

```ts
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
  });

  it('el umbral es configurable', () => {
    expect(avisoLluvia(true, ok(1, 30), 30)).toEqual({ motivo: 'probabilidad', valor: 30 });
  });
});
```

**Step 3: Implement**

```ts
import { esPrecipitacion } from './codigos';
import type { Pronostico } from './pronostico';

export const UMBRAL_LLUVIA = 50;

export function avisoLluvia(alAireLibre: boolean, p: Pronostico, umbral = UMBRAL_LLUVIA) {
  if (!alAireLibre || p.tipo !== 'ok') return null;
  if (esPrecipitacion(p.codigo)) return { motivo: 'codigo' as const, valor: p.codigo };
  if (p.probLluvia !== null && p.probLluvia >= umbral) return { motivo: 'probabilidad' as const, valor: p.probLluvia };
  return null;
}
```

**Step 4: Prove it** — change `>=` to `>`; the 50% test goes red. Restore.

**Step 5: Commit** — `git commit -m "feat(clima): rain warning for outdoor plans"`

---

## Phase 4 — The interface

Components receive the domain modules and collaborators as props or context, so
tests pass fakes instead of mocking globals.

### Task 12: Agenda state and per-reminder weather

**Files:**
- Create: `src/estado/useAgenda.ts`, `src/estado/useClima.ts`
- Test: `src/estado/useAgenda.test.tsx`, `src/estado/useClima.test.tsx`

Behaviour to test with `renderHook`:

- `crear`, `editar`, `borrar` persist through the almacén; **editing keeps the id**.
- If the almacén loads as `corrupto`, the hook exposes that state and `crear` does
  not call `guardar`.
- `useClima(lugar, fecha)` fetches through `pronosticoDiario` only when
  `estadoVentana` is `disponible`, caches by `latitud,longitud,fecha`, and records the
  time of the request.
- **Regression — stale weather:** two reminders on the same date in different
  places show two different forecasts. The fake fetch answers by `latitude`; the test
  fails if one reminder can show the other's weather.
- **Regression — crash after a failed call:** with a fetch that rejects, creating a
  second reminder succeeds.

Each regression test is watched going red against a deliberately broken version
(share one cache key for all places; let a rejected fetch escape) before the real
implementation is restored.

**Commit** — `git commit -m "feat(estado): agenda state and weather per place and date"`

---

### Task 13: The calendar grid

**Files:**
- Create: `src/componentes/Calendario.tsx`, `src/componentes/Calendario.css`
- Test: `src/componentes/Calendario.test.tsx`

- Month header with previous, next and today; any month and year.
- Cells from `celdasDelMes`, reminders from `recordatoriosDelDia`.
- At most three reminders per cell, then a `+N más` button that opens the day.
- `role="grid"`, one `role="gridcell"` per day, each labelled with the full date in
  `es-DO`; arrow keys move focus between days.

Tests:

- **Regression — the month selector did nothing:** render September 2026, click
  next, assert the cell labelled 1 de octubre de 2026 exists and 30 de septiembre
  does not.
- **Regression — days 1 to 9:** a reminder on `2026-09-05` is inside the cell for
  5 de septiembre.
- Five reminders on one day render three and `+2 más`.
- `ArrowRight` from the 5th focuses the 6th.

**Commit** — `git commit -m "feat(ui): calendar grid with month navigation and overflow"`

---

### Task 14: Reminder form and place picker

**Files:**
- Create: `src/componentes/FormularioRecordatorio.tsx`, `src/componentes/BuscadorLugar.tsx`
- Test: `src/componentes/FormularioRecordatorio.test.tsx`, `src/componentes/BuscadorLugar.test.tsx`

- Text input shows a live `n/30` counter; validation messages come from
  `validarRecordatorio`, not duplicated in the component.
- Date and time inputs have no artificial `min`: past dates are allowed.
- Place picker searches RD by default, with a visible *Buscar en todo el mundo*
  toggle; every option shows name, province and country; a place is only set by
  choosing an option, never by free text.
- Colour and *Plan al aire libre* checkbox.

Tests:

- Typing 30 characters and submitting creates the reminder; 31 shows the error and
  does not.
- Submitting without choosing a place from the list shows the place error.
- With the toggle off, the search request carries `countryCode=DO`; on, it does not.
- An empty search renders *Sin resultados*, not a crash.

**Commit** — `git commit -m "feat(ui): reminder form and place picker"`

---

### Task 15: Weather inside a reminder

**Files:**
- Create: `src/componentes/ClimaRecordatorio.tsx`
- Test: `src/componentes/ClimaRecordatorio.test.tsx`

States, each with a test:

- `ok`: label, max / min, and rain probability.
- Rain warning: says *why* — the probability or the condition.
- `futuro`: *Pronóstico disponible a partir del 24 de septiembre* (formatted `es-DO`).
- `pasado` and `error`: say so plainly; never an empty box.

**Commit** — `git commit -m "feat(ui): weather states inside each reminder"`

---

### Task 16: README

Replace nothing that exists: Task 3 deleted the Create React App README. Write:

- What it is, in two sentences, and the link to both sites.
- `npm install`, `npm run dev`, `npm test`.
- The decisions from the design, briefly: no server and why, places by coordinates
  and the Santiago example, weather not stored and why, the forecast window.
- The **Qué estaba roto** table from the design, each row linked to the test that
  now guards it.

**Commit** — `git commit -m "docs: README with the 2023 failures and what guards each one"`

---

## Phase 5 — Ship

### Task 17: Deploy the product

```bash
npm run build
vercel link          # project: calendar-reminder; same scope as invoice-generator
vercel deploy --prod
```

Check `vercel link --help` if the flags differ in the installed CLI (50.22.1 on
2026-09-14). Confirm the scope is the one invoice-generator uses before linking.

Verify in production:

- The page loads and creating a reminder in Santo Domingo shows a forecast. In the
  browser's network panel the request to `api.open-meteo.com` returns 200.
- `curl -s <url> | grep -o 'src="[^"]*\.js"'`, fetch each bundle, and confirm
  `grep -oE '\b[a-f0-9]{32}\b'` finds nothing that looks like a key. Inspect any
  match by hand.

---

### Task 18: Publish 2023 (BLOCKED until Task 0)

```bash
bash scripts/publicar-2023.sh /tmp/sitio-2023
cd /tmp/sitio-2023
vercel link          # a separate project: calendar-reminder-2023
vercel deploy --prod
```

Verify in production:

- `/` redirects to `/calendar-reminder/`.
- Each of the 12 files served matches its blob: for each path in
  `git ls-tree -r --name-only v2023-jobsity-build`, download it from the site and
  compare `git hash-object` against the tree.
- The calendar renders. Its weather does not work, and must not be made to: that is
  the 2023 behaviour.

---

### Task 19: Point GitHub Pages at the product

Only after Task 1 tagged `v2023-jobsity-build`.

```bash
git worktree add /tmp/gh-pages gh-pages
cd /tmp/gh-pages
git rm -r -q .
```

Write `index.html` and an identical `404.html`:

```html
<!doctype html>
<meta charset="utf-8">
<title>Agenda con clima</title>
<meta http-equiv="refresh" content="0; url=<URL-DEL-PRODUCTO>">
<link rel="canonical" href="<URL-DEL-PRODUCTO>">
<p>Se mudó a <a href="<URL-DEL-PRODUCTO>"><URL-DEL-PRODUCTO></a>.</p>
```

```bash
git config --local user.email   # must print gabbs27@users.noreply.github.com
git add -A
git commit -m "chore: GitHub Pages now redirects to the Vercel deployment"
git push origin gh-pages
cd - && git worktree remove /tmp/gh-pages
```

Verify: `curl -s https://gabbs27.github.io/calendar-reminder/ | grep -o 'http-equiv="refresh"[^>]*'`
shows the product URL, and `git ls-tree -r --name-only v2023-jobsity-build | wc -l`
still prints 12.

---

### Task 20: One card, two links in the portfolio

In **the other repo**, `~/Desktop/Proyectos/sanity-react`. Check its identity first:
`git config --local user.email` must print the Gabbs27 noreply address.

**Files:**
- Modify: `src/config/projects.json` (entry `id: 4`)
- Modify: `src/assets/data.ts` (`Project` interface)
- Modify: `src/components/card/Card.tsx`
- Modify: `src/components/Portfolio.tsx` (pass the new prop)
- Modify: `scripts/prerender.mjs` (`projectList`)
- Modify: `scripts/__tests__/surfaces.test.mjs` (home projects test)
- Replace: `public/images/calendar.webp`

**Step 1: Data and the failing assertion first**

In `projects.json`, entry 4: `url` becomes the product URL, add `"urlAntes"` with the
2023 site URL, set the title and description from the live product (English, like
the other cards), and set `languages` to what it is built with.

In `surfaces.test.mjs`, inside the loop of
`'the home page lists every project without JavaScript'`, after the `project.url`
assertion:

```js
if (project.urlAntes) {
  assert.ok(
    has(shown, project.urlAntes),
    `home noscript is missing the 2023 link for "${project.title}"`
  );
}
```

Run `npm run build && npm test`. **Expected: that test fails** — the prerenderer does
not emit `urlAntes` yet.

**Step 2: Make it pass**

`data.ts`, in `Project`: `urlAntes?: string;`

`prerender.mjs`, in `projectList`:

```js
const projectList = projects
  .map(
    (p) =>
      `<li><a href="${esc(p.url)}">${esc(p.title)}</a>` +
      (p.urlAntes ? ` · <a href="${esc(p.urlAntes)}">2023 version</a>` : '') +
      ` — ${esc(p.description)} <em>${esc((p.languages || []).join(', '))}</em></li>`
  )
  .join('');
```

`Card.tsx`: add `urlAntes?: string` to `CardProps`, and inside `.card-overlay`, after
the existing link:

```tsx
{urlAntes && (
  <a
    href={urlAntes}
    className='view-project view-project--antes'
    target='_blank'
    rel='noopener noreferrer'>
    2023 version
  </a>
)}
```

`Portfolio.tsx`: pass `urlAntes={project.urlAntes}` to `<Card>`.

Run `npm run build && npm test`. Expected: all green.

**Step 3: Screenshot**

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1440,900 --virtual-time-budget=12000 \
  --screenshot=public/images/calendar.png "<URL-DEL-PRODUCTO>"
bash scripts/optimize-images.sh
rm public/images/calendar.png
```

Look at the image before committing. A loading state or an empty month is not the
screenshot.

**Step 4: Commit, push, verify production**

```bash
git add -A
git commit -m "feat(projects): the calendar card links the product and the 2023 challenge"
git push
```

Then `curl -s https://codewithgabo.com/` must contain both URLs.

---

## Out of scope for v1, on purpose

- Accounts and sync across devices.
- Recurring reminders and notifications.
- Commercial use: Open-Meteo's free tier does not cover it.
- Anything that changes the 2023 artifact.
