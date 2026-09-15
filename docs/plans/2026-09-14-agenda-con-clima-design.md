# Diseño — Agenda con clima

**Fecha:** 2026-09-14
**Estado:** aprobado, pendiente de plan de implementación
**Repo:** `Gabbs27/calendar-reminder` — el producto se construye aquí, al lado del reto de 2023, no en un repo nuevo

---

## De dónde viene

Este repo es el reto técnico de React de Jobsity, resuelto entre el 18 y el 26 de
enero de 2023 (`master` en `dc9230d`) y publicado en GitHub Pages el 27
(`gh-pages` en `d356e92`). No se tocó desde entonces.

El enunciado, leído el 2026-09-14 en `Jobsity/ReactChallenge`, pedía:

- **Obligatorio:** agregar recordatorios de máximo 30 caracteres para un día y
  una hora, con ciudad; editarlos (texto, ciudad, día y hora); y consultar el
  pronóstico del clima **para la fecha del recordatorio** según la ciudad.
- **Bonus:** más de un mes o año; manejar el desbordamiento cuando hay muchos
  recordatorios en un día; test unitario de «agregar recordatorios de máximo 30
  caracteres para un día y hora, con ciudad».
- **Restricciones:** construir el calendario a mano, sin librerías de calendario;
  la ruta `/calendar`; entregar API keys que funcionen.
- **Evaluación:** toda la información relevante en el README, y la capacidad con
  CSS.

## Qué estaba roto

Comprobado el 2026-09-14 sobre el código y sobre lo que sirve GitHub Pages.

| # | Fallo | Evidencia |
|---|---|---|
| 1 | La API key de OpenWeather es pública | escrita en `src/api/weather.js` desde `e75c103` (2023-01-25), y presente en el bundle publicado `main.4282c633.js` |
| 2 | El clima se pide por `http://` desde una página `https` | `WeatherMapInstance.js`; los navegadores bloquean ese contenido mixto |
| 3 | Pide el clima de hoy, no el pronóstico de la fecha | llama a `/weather` solo con `q=ciudad` |
| 4 | Los recordatorios de los días 1 al 9 nunca aparecen | se guarda `moment(fecha).format('DD')` → `"05"` y se compara con `day.toString()` → `"5"`; verificado ejecutándolo |
| 5 | Cada recordatorio guarda el clima de la llamada anterior | se despacha la consulta sin esperarla y se lee `weather` del store en el mismo momento |
| 6 | Tras un fallo del clima, crear el segundo recordatorio rompe la app | sin caso `rejected`, `weather` queda `undefined`; `weather !== null` lo deja pasar a `weather[0]`. Editar lee `weather[0]` sin comprobar nada |
| 7 | El selector de mes no hace nada | `Calendar` no recibe props y `useCalendar` fija `moment()` |
| 8 | No acepta un recordatorio de exactamente 30 caracteres | valida `value.length < 30` con `maxLength={30}` |
| 9 | No se puede agendar fuera del mes actual, y la hora mínima es la hora de ahora para cualquier día | `min`/`max` del input de fecha y `min={currentTime}` en el de hora |
| 10 | El README es el de Create React App | y el README era criterio de evaluación |
| 11 | El único test que renderiza el calendario falla | `CalendarApp.test.js` no importa axios bajo Jest; de los tres que pasan, uno prueba el `App.js` de relleno que ni se monta, otro el `Counter` del enunciado, y el de borrar recordatorio borra de un estado vacío |

## Qué se construye

Una **agenda con clima**: la misma idea del reto —recordatorios con lugar y clima—
hecha para que el clima sirva de algo. Sin cuentas ni base de datos.

Se mantiene reconocible a propósito. El «antes y después» solo se lee si el después
es el mismo producto crecido; si fuera otra cosa, compartiría repo con el reto sin
tener nada que ver con él.

## Un repo, dos sitios

| | 2023 congelado | Producto |
|---|---|---|
| Código | tag `v2023-jobsity` sobre `dc9230d` | rama de trabajo, luego la principal |
| Qué se publica | los **12 archivos** de `gh-pages` en `d356e92`, sin recompilar | build nuevo |
| Dónde | proyecto de Vercel propio | proyecto de Vercel propio |

**El 2023 se publica tal cual, con sus fallos.** Arreglarlo lo convertiría en otra
cosa. Por eso no se recompila desde el tag: un build nuevo de ese código hoy no es
el artefacto que se entregó.

Su `index.html` carga el JS y el CSS con ruta absoluta (`/calendar-reminder/static/…`),
así que los archivos se sirven bajo `/calendar-reminder/` y `/` redirige ahí. En la
raíz, esos assets darían 404.

**Bloqueante para publicar el 2023: revocar la key de OpenWeather.** El bundle la
lleva dentro. Ya es pública en la historia de git y en GitHub Pages, pero publicarla
en un segundo sitio mientras siga viva agrega exposición. Revocarla lo hace Gabriel
desde el panel de OpenWeather; borrarla del código no la saca de la historia.

`gabbs27.github.io/calendar-reminder` pasa a redirigir al producto, como se hizo con
el emisor e-CF.

El portafolio muestra una tarjeta con dos enlaces. Eso toca `sanity-react`: hoy cada
proyecto tiene una sola `url`, y su test comprueba que cada proyecto aparezca con su
enlace en el `noscript` de la portada.

## Stack

**Vite + React + TypeScript, estático.**

La única razón para un servidor sería esconder una key, y no hay key: Open-Meteo no
la pide para uso no comercial y responde `access-control-allow-origin: *`, así que
se llama desde el navegador. Es además el stack de `sanity-react`.

Se descartó Next.js, porque trae un servidor que nadie usa, y seguir con Create React
App, que está descontinuado.

Sin librería de calendario, como pedía el reto.

## Datos

Todo en el navegador, en `localStorage`, con versión de esquema.

Un recordatorio:

```ts
{
  id: string
  texto: string          // 1 a 30 caracteres, 30 incluidos
  fecha: string          // ISO, AAAA-MM-DD
  hora: string           // HH:MM
  lugar: {
    nombre: string
    provincia?: string
    pais: string         // código ISO
    latitud: number
    longitud: number
    zonaHoraria: string
  }
  color: string
  alAireLibre: boolean
}
```

**El lugar se guarda con coordenadas, no con el nombre.** Una ciudad por nombre es
ambigua, y en RD lo es de forma concreta: ver *Ciudad*.

**El clima no se guarda en el recordatorio.** Se consulta por coordenadas y fecha y
se cachea con la hora de la consulta. Un pronóstico cambia; guardarlo al crear es lo
que produjo el fallo 5.

Si lo guardado no valida contra el esquema, la app lo dice y **no lo sobrescribe**.
Perder los recordatorios de alguien por un JSON inesperado es peor que no arrancar.

## Clima

Open-Meteo, pronóstico diario por coordenadas, fecha y zona horaria del lugar:
`weather_code`, `temperature_2m_max`, `temperature_2m_min`,
`precipitation_probability_max`.

**La ventana es finita.** La documentación da hasta 16 días de pronóstico. Una
consulta hecha el 2026-09-14 aceptaba fechas del 2026-06-14 al 2026-09-30, y para el
2026-10-10 respondió `Parameter 'start_date' is out of allowed range from 2026-06-14
to 2026-09-30`. Fuera de esa ventana el recordatorio dice *«pronóstico disponible a
partir del …»*. Si la API contradice el cálculo local, manda la API.

**Los códigos** se traducen al español con la tabla WMO de la documentación, completa.
La documentación dice que la tormenta con granizo (96, 99) solo se pronostica en
Centroeuropa; para Santo Domingo el 2026-09-01 devolvió `96`. No se filtra por región.

**Aviso de lluvia** en los recordatorios al aire libre cuando la probabilidad máxima
de lluvia llega al 50%, o el código es llovizna, lluvia o tormenta. **El 50% es una
decisión de producto, no una regla meteorológica**, y es configurable.

## Ciudad

Búsqueda con la API de geocodificación de Open-Meteo, **filtrada a República
Dominicana por defecto**, con una opción para buscar en todo el mundo. Cada resultado
muestra nombre, provincia y país.

Motivo, comprobado el 2026-09-14: buscar «Santiago» sin filtro devuelve primero
Santiago de Chile, Santiago de Cuba y Santiago de Compostela, y Santiago de los
Caballeros no aparece entre los 20 primeros. Con `countryCode=DO` sale el primero.

Una búsqueda sin resultados devuelve un objeto **sin la clave `results`**, no una
lista vacía. Tratarlos igual es un fallo esperando pasar.

## Calendario

- Cuadrícula propia, navegable a cualquier mes y año: anterior, siguiente, hoy.
- Muchos recordatorios en un día: se muestran unos cuantos y un *«+N más»* que abre
  el día.
- Se puede agendar en cualquier fecha, pasadas incluidas.
- Operable con teclado y con etiquetas accesibles; fechas con
  `Intl.DateTimeFormat('es-DO')`.

## Cómo se verifica

Cada fallo comprobado de 2023 se convierte en un test que falla con la lógica vieja y
pasa con la nueva:

| Fallo | Test |
|---|---|
| 4 — días 1 al 9 | un recordatorio el día 5 aparece en la celda del 5 |
| 5 — clima de la llamada anterior | el clima mostrado corresponde a las coordenadas y la fecha del recordatorio |
| 6 — la segunda creación rompe | un error de la API de clima no impide crear ni editar |
| 8 — 30 caracteres | 30 se aceptan, 31 se rechazan, vacío se rechaza |
| 7 — el mes no cambia | navegar de mes cambia los días mostrados |

Además: los estados de la ventana de pronóstico con `fetch` simulado (dentro, fuera,
error, sin `results`), y un `localStorage` corrupto que no se borra.

Vitest y Testing Library. Cada guard se comprueba en los dos sentidos, en la misma
sesión: rojo sobre el estado roto, verde sobre el arreglado.

## README

Qué es, cómo se corre, las decisiones de este documento, y la tabla de *Qué estaba
roto* con el enlace a los dos sitios.

## Fuera de la v1

- Cuentas y sincronización entre dispositivos: los recordatorios viven en ese navegador.
- Recurrencia y notificaciones.
- Uso comercial: el plan gratuito de Open-Meteo no lo cubre.
