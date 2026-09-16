# Agenda con clima

Recordatorios con el pronóstico de su día y de su lugar: agendas algo, eliges dónde, y la
agenda te dice qué tiempo hará ahí ese día. Es el reto de React de Jobsity de enero de 2023,
rehecho para que el clima sirva de algo, en el mismo repositorio que el original.

## Los dos sitios

| | Dónde | Qué es |
|---|---|---|
| Producto | <https://agenda-con-clima.vercel.app> | Este código |
| Reto de 2023 | <https://calendar-reminder-2023.vercel.app> | Los 12 archivos publicados el 27 de enero de 2023, sin recompilar |

La dirección vieja, `gabbs27.github.io/calendar-reminder`, redirige al producto.

**El de 2023 se publica con sus fallos.** Arreglarlo lo convertiría en otra cosa, y tampoco
se recompila desde su código: un build nuevo de hoy no es el artefacto que se entregó. El tag
`v2023-jobsity` guarda ese código y `v2023-jobsity-build` el build publicado.

## Cómo se corre

```bash
npm install
npm run dev
npm test
```

Node 22 o más nuevo, que es lo que piden Vite 8, Vitest 5 y jsdom 30. El repo trae `.nvmrc`.

## Decisiones

- **Sin servidor.** La única razón para tener uno sería esconder una API key, y no hay:
  Open-Meteo no la pide para uso no comercial y responde con CORS abierto, así que el
  navegador llama directo. El calendario está hecho a mano, sin librerías, como pedía el reto.
- **El lugar se guarda con coordenadas, no con el nombre.** Buscar «Santiago» sin filtrar
  devuelve Santiago de Chile, de Cuba y de Compostela, y Santiago de los Caballeros no aparece
  entre los 20 primeros; filtrando por República Dominicana sale primero. Por eso la búsqueda
  filtra a RD por defecto, con un interruptor para buscar en todo el mundo.
- **El clima no se guarda dentro del recordatorio.** Se consulta por coordenadas y fecha, y se
  cachea con la hora de la consulta. Guardarlo al crear fue exactamente el fallo 5 de 2023.
- **La ventana de pronóstico es finita:** 92 días atrás y 16 adelante. Fuera de ahí el
  recordatorio dice desde cuándo habrá pronóstico. Dentro de la ventana, la API a veces
  responde 200 con el código y las temperaturas en `null` (más de unos 68 días atrás, y el día
  16): eso es un estado propio, no un pronóstico vacío.
- **Los recordatorios viven en el navegador**, en `localStorage` con versión de esquema. Si lo
  guardado no se puede leer, la app lo dice y **no lo sobrescribe**: perder los recordatorios
  de alguien por un JSON inesperado es peor que no arrancar.
- **El aviso de lluvia salta al 50% de probabilidad**, o cuando el código del clima es
  llovizna, lluvia o tormenta. Ese 50% es una decisión de producto, no una regla
  meteorológica: es un parámetro, y el aviso dice qué lo disparó.

## Qué estaba roto en 2023, y qué lo vigila ahora

| # | Fallo de 2023 | Lo que ahora lo impide |
|---|---|---|
| 1 | La API key de OpenWeather iba dentro del bundle publicado | No hay key: Open-Meteo no la pide |
| 2 | El clima se pedía por `http://` desde una página `https` | Una sola llamada, por `https` |
| 3 | Pedía el clima de hoy, no el pronóstico de la fecha | `clima/pronostico.test.ts`: «pide los campos y la fecha exactos» |
| 4 | Los recordatorios de los días 1 al 9 nunca aparecían | `fechas.test.ts` y `Calendario.test.tsx`: «un recordatorio del día 5 …» |
| 5 | Cada recordatorio mostraba el clima de la llamada anterior | `useClima.test.tsx`: «dos lugares el mismo día no comparten pronóstico» |
| 6 | Tras un fallo del clima, crear el segundo recordatorio rompía la app | `useClima.test.tsx`: «una consulta que falla no rompe el hook ni el siguiente» |
| 7 | El selector de mes no hacía nada | `Calendario.test.tsx`: «cambia de mes» |
| 8 | No aceptaba un recordatorio de exactamente 30 caracteres | `recordatorio.test.ts`: «acepta exactamente 30 caracteres» |
| 9 | No se podía agendar fuera del mes actual ni a una hora pasada | `FormularioRecordatorio.test.tsx`: «deja agendar en el pasado» |
| 10 | El README era el de Create React App | Este |
| 11 | El único test que renderizaba el calendario fallaba | `npm test` corre toda la suite, interfaz incluida |

Cada uno de esos tests se vio **fallar** con el fallo puesto de vuelta antes de darlo por
bueno. Un test que solo se ha visto pasar no prueba nada.

## Cómo está organizado

- `src/dominio/` — fechas y cuadrícula del mes, validación, almacenamiento, clima (códigos
  WMO, ventana, cliente de pronóstico, aviso de lluvia) y búsqueda de lugares. TypeScript
  puro, sin React: `fetch` y `localStorage` entran por parámetro, así que los tests corren sin
  navegador ni red.
- `src/estado/` — `useAgenda` (crear, editar, borrar, persistir) y `useClima` (pronóstico por
  lugar y fecha, con caché).
- `src/componentes/` — calendario, formulario, buscador de lugar, clima del recordatorio y
  panel del día.
- `scripts/publicar-2023.sh` — reconstruye el sitio de 2023 desde su tag y comprueba, archivo
  por archivo, que es idéntico al que se publicó.

Vite, React 19, TypeScript, Vitest y Testing Library.

## Fuera de la v1, a propósito

- Cuentas y sincronización entre dispositivos: los recordatorios viven en ese navegador.
- Recurrencia y notificaciones.
- Uso comercial: el plan gratuito de Open-Meteo no lo cubre.
